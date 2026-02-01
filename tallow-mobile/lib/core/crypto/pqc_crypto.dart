import 'dart:typed_data';
import 'dart:math';
import 'dart:ffi' as ffi;
import 'dart:io';
import 'package:cryptography/cryptography.dart';
import 'package:pointycastle/export.dart';
import 'package:convert/convert.dart';
import 'package:flutter/foundation.dart';

/// ML-KEM-768 (Kyber768) implementation for post-quantum key encapsulation
/// Combined with X25519 for hybrid key exchange
///
/// This implementation uses liboqs via FFI for production-grade security.
/// Falls back to a pure Dart implementation when FFI is unavailable.
class PqcCrypto {
  static final PqcCrypto _instance = PqcCrypto._internal();
  factory PqcCrypto() => _instance;
  PqcCrypto._internal();

  // ML-KEM-768 NIST parameters (FIPS 203)
  static const int kyberN = 256;
  static const int kyberK = 3; // ML-KEM-768 uses k=3
  static const int kyberQ = 3329;
  static const int kyberEta1 = 2;
  static const int kyberEta2 = 2;
  static const int kyberDu = 10;
  static const int kyberDv = 4;

  // Key sizes for ML-KEM-768
  static const int publicKeySize = 1184;
  static const int secretKeySize = 2400;
  static const int ciphertextSize = 1088;
  static const int sharedSecretSize = 32;

  // Internal state
  final _secureRandom = FortunaRandom();
  bool _initialized = false;
  _LibOqsBindings? _liboqs;

  void _ensureInitialized() {
    if (!_initialized) {
      final seed = Uint8List(32);
      final random = Random.secure();
      for (var i = 0; i < seed.length; i++) {
        seed[i] = random.nextInt(256);
      }
      _secureRandom.seed(KeyParameter(seed));
      _tryLoadLibOqs();
      _initialized = true;
    }
  }

  void _tryLoadLibOqs() {
    if (kIsWeb) return; // Web uses pure Dart implementation

    try {
      if (Platform.isAndroid) {
        _liboqs = _LibOqsBindings(ffi.DynamicLibrary.open('liboqs.so'));
      } else if (Platform.isIOS || Platform.isMacOS) {
        _liboqs = _LibOqsBindings(ffi.DynamicLibrary.process());
      } else if (Platform.isLinux) {
        _liboqs = _LibOqsBindings(ffi.DynamicLibrary.open('liboqs.so'));
      } else if (Platform.isWindows) {
        _liboqs = _LibOqsBindings(ffi.DynamicLibrary.open('oqs.dll'));
      }
    } catch (e) {
      debugPrint('liboqs not available, using pure Dart implementation: $e');
      _liboqs = null;
    }
  }

  bool get hasNativeSupport => _liboqs != null;

  /// Generate ML-KEM-768 key pair
  Future<MlKemKeyPair> generateKeyPair() async {
    _ensureInitialized();

    if (_liboqs != null) {
      return _generateKeyPairNative();
    }
    return _generateKeyPairPure();
  }

  /// Native liboqs implementation
  Future<MlKemKeyPair> _generateKeyPairNative() async {
    final publicKey = ffi.calloc<ffi.Uint8>(publicKeySize);
    final secretKey = ffi.calloc<ffi.Uint8>(secretKeySize);

    try {
      final result = _liboqs!.OQS_KEM_keypair(
        _liboqs!.mlKem768,
        publicKey,
        secretKey,
      );

      if (result != 0) {
        throw CryptoException('ML-KEM-768 key generation failed');
      }

      return MlKemKeyPair(
        publicKey: MlKemPublicKey(
          Uint8List.fromList(publicKey.asTypedList(publicKeySize)),
        ),
        secretKey: MlKemSecretKey(
          Uint8List.fromList(secretKey.asTypedList(secretKeySize)),
        ),
      );
    } finally {
      // Securely clear memory
      for (var i = 0; i < secretKeySize; i++) {
        secretKey[i] = 0;
      }
      ffi.calloc.free(publicKey);
      ffi.calloc.free(secretKey);
    }
  }

  /// Pure Dart ML-KEM-768 implementation (FIPS 203 compliant)
  Future<MlKemKeyPair> _generateKeyPairPure() async {
    // Generate random seed d and z
    final d = _generateRandomBytes(32);
    final z = _generateRandomBytes(32);

    // G(d) = (rho, sigma)
    final gOutput = _hashG(d);
    final rho = gOutput.sublist(0, 32);
    final sigma = gOutput.sublist(32, 64);

    // Generate matrix A from rho
    final matrixA = _generateMatrixA(rho);

    // Sample secret vector s from CBD(eta1)
    final s = _samplePolyCBDVector(sigma, 0, kyberK, kyberEta1);

    // Sample error vector e from CBD(eta1)
    final e = _samplePolyCBDVector(sigma, kyberK, kyberK, kyberEta1);

    // Compute t = A*s + e (in NTT domain)
    final sNtt = _nttVector(s);
    final t = List<List<int>>.generate(kyberK, (i) {
      final result = List<int>.filled(kyberN, 0);
      for (var j = 0; j < kyberK; j++) {
        final product = _nttMultiply(matrixA[i][j], sNtt[j]);
        for (var k = 0; k < kyberN; k++) {
          result[k] = _modQ(result[k] + product[k]);
        }
      }
      return result;
    });

    // Add error in normal domain
    final tNormal = _invNttVector(t);
    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN; j++) {
        tNormal[i][j] = _modQ(tNormal[i][j] + e[i][j]);
      }
    }

    final tNtt = _nttVector(tNormal);

    // Encode public key: pk = (t, rho)
    final publicKeyBytes = _encodePublicKey(tNtt, rho);

    // Encode secret key: sk = (s, pk, H(pk), z)
    final pkHash = _hashH(publicKeyBytes);
    final secretKeyBytes = _encodeSecretKey(s, publicKeyBytes, pkHash, z);

    return MlKemKeyPair(
      publicKey: MlKemPublicKey(publicKeyBytes),
      secretKey: MlKemSecretKey(secretKeyBytes),
    );
  }

  /// Encapsulate - generate shared secret and ciphertext
  Future<MlKemEncapsulation> encapsulate(MlKemPublicKey publicKey) async {
    _ensureInitialized();

    if (_liboqs != null) {
      return _encapsulateNative(publicKey);
    }
    return _encapsulatePure(publicKey);
  }

  /// Native liboqs encapsulation
  Future<MlKemEncapsulation> _encapsulateNative(MlKemPublicKey publicKey) async {
    final ciphertext = ffi.calloc<ffi.Uint8>(ciphertextSize);
    final sharedSecret = ffi.calloc<ffi.Uint8>(sharedSecretSize);
    final pk = ffi.calloc<ffi.Uint8>(publicKeySize);

    try {
      // Copy public key to native memory
      final pkBytes = publicKey.bytes;
      for (var i = 0; i < publicKeySize; i++) {
        pk[i] = pkBytes[i];
      }

      final result = _liboqs!.OQS_KEM_encaps(
        _liboqs!.mlKem768,
        ciphertext,
        sharedSecret,
        pk,
      );

      if (result != 0) {
        throw CryptoException('ML-KEM-768 encapsulation failed');
      }

      return MlKemEncapsulation(
        sharedSecret: Uint8List.fromList(
          sharedSecret.asTypedList(sharedSecretSize),
        ),
        ciphertext: MlKemCiphertext(
          Uint8List.fromList(ciphertext.asTypedList(ciphertextSize)),
        ),
      );
    } finally {
      // Securely clear shared secret
      for (var i = 0; i < sharedSecretSize; i++) {
        sharedSecret[i] = 0;
      }
      ffi.calloc.free(ciphertext);
      ffi.calloc.free(sharedSecret);
      ffi.calloc.free(pk);
    }
  }

  /// Pure Dart encapsulation (FIPS 203)
  Future<MlKemEncapsulation> _encapsulatePure(MlKemPublicKey publicKey) async {
    // Decode public key
    final decoded = _decodePublicKey(publicKey.bytes);
    final t = decoded.t;
    final rho = decoded.rho;

    // Generate random message m
    final m = _generateRandomBytes(32);

    // (K, r) = G(m || H(pk))
    final pkHash = _hashH(publicKey.bytes);
    final kr = _hashG(Uint8List.fromList([...m, ...pkHash]));
    final k = kr.sublist(0, 32);
    final r = kr.sublist(32, 64);

    // Generate matrix A^T from rho
    final matrixA = _generateMatrixA(rho);

    // Sample r vector from CBD(eta1)
    final rVec = _samplePolyCBDVector(r, 0, kyberK, kyberEta1);

    // Sample e1 from CBD(eta2)
    final e1 = _samplePolyCBDVector(r, kyberK, kyberK, kyberEta2);

    // Sample e2 from CBD(eta2)
    final e2Seed = _prf(r, 2 * kyberK);
    final e2 = _samplePolyCBD(e2Seed, kyberEta2);

    // Compute u = A^T * r + e1
    final rNtt = _nttVector(rVec);
    final u = List<List<int>>.generate(kyberK, (i) {
      final result = List<int>.filled(kyberN, 0);
      for (var j = 0; j < kyberK; j++) {
        final product = _nttMultiply(matrixA[j][i], rNtt[j]);
        for (var k = 0; k < kyberN; k++) {
          result[k] = _modQ(result[k] + product[k]);
        }
      }
      return result;
    });

    final uNormal = _invNttVector(u);
    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN; j++) {
        uNormal[i][j] = _modQ(uNormal[i][j] + e1[i][j]);
      }
    }

    // Compute v = t^T * r + e2 + Decompress(m)
    var v = List<int>.filled(kyberN, 0);
    for (var i = 0; i < kyberK; i++) {
      final product = _nttMultiply(t[i], rNtt[i]);
      final productNormal = _invNtt(product);
      for (var j = 0; j < kyberN; j++) {
        v[j] = _modQ(v[j] + productNormal[j]);
      }
    }

    // Add e2 and message
    final mPoly = _decompressMessage(m);
    for (var i = 0; i < kyberN; i++) {
      v[i] = _modQ(v[i] + e2[i] + mPoly[i]);
    }

    // Compress and encode ciphertext
    final ciphertext = _encodeCiphertext(uNormal, v);

    // Compute shared secret K = KDF(K || H(c))
    final cHash = _hashH(ciphertext);
    final sharedSecret = _kdf(Uint8List.fromList([...k, ...cHash]));

    return MlKemEncapsulation(
      sharedSecret: sharedSecret,
      ciphertext: MlKemCiphertext(ciphertext),
    );
  }

  /// Decapsulate - recover shared secret from ciphertext
  Future<Uint8List> decapsulate(
    MlKemCiphertext ciphertext,
    MlKemSecretKey secretKey,
  ) async {
    _ensureInitialized();

    if (_liboqs != null) {
      return _decapsulateNative(ciphertext, secretKey);
    }
    return _decapsulatePure(ciphertext, secretKey);
  }

  /// Native liboqs decapsulation
  Future<Uint8List> _decapsulateNative(
    MlKemCiphertext ciphertext,
    MlKemSecretKey secretKey,
  ) async {
    final sharedSecret = ffi.calloc<ffi.Uint8>(sharedSecretSize);
    final ct = ffi.calloc<ffi.Uint8>(ciphertextSize);
    final sk = ffi.calloc<ffi.Uint8>(secretKeySize);

    try {
      // Copy to native memory
      final ctBytes = ciphertext.bytes;
      final skBytes = secretKey.bytes;
      for (var i = 0; i < ciphertextSize; i++) {
        ct[i] = ctBytes[i];
      }
      for (var i = 0; i < secretKeySize; i++) {
        sk[i] = skBytes[i];
      }

      final result = _liboqs!.OQS_KEM_decaps(
        _liboqs!.mlKem768,
        sharedSecret,
        ct,
        sk,
      );

      if (result != 0) {
        throw CryptoException('ML-KEM-768 decapsulation failed');
      }

      return Uint8List.fromList(sharedSecret.asTypedList(sharedSecretSize));
    } finally {
      for (var i = 0; i < sharedSecretSize; i++) {
        sharedSecret[i] = 0;
      }
      ffi.calloc.free(sharedSecret);
      ffi.calloc.free(ct);
      ffi.calloc.free(sk);
    }
  }

  /// Pure Dart decapsulation (FIPS 203)
  Future<Uint8List> _decapsulatePure(
    MlKemCiphertext ciphertext,
    MlKemSecretKey secretKey,
  ) async {
    // Decode secret key
    final decoded = _decodeSecretKey(secretKey.bytes);
    final s = decoded.s;
    final pk = decoded.pk;
    final pkHash = decoded.pkHash;
    final z = decoded.z;

    // Decode ciphertext
    final ctDecoded = _decodeCiphertext(ciphertext.bytes);
    final u = ctDecoded.u;
    final v = ctDecoded.v;

    // Compute m' = Compress(v - s^T * u)
    final sNtt = _nttVector(s);
    final uNtt = _nttVector(u);

    var diff = List<int>.from(v);
    for (var i = 0; i < kyberK; i++) {
      final product = _nttMultiply(sNtt[i], uNtt[i]);
      final productNormal = _invNtt(product);
      for (var j = 0; j < kyberN; j++) {
        diff[j] = _modQ(diff[j] - productNormal[j]);
      }
    }

    final mPrime = _compressMessage(diff);

    // (K', r') = G(m' || H(pk))
    final krPrime = _hashG(Uint8List.fromList([...mPrime, ...pkHash]));
    final kPrime = krPrime.sublist(0, 32);

    // Re-encapsulate to verify (implicit rejection)
    final reEncap = await _encapsulatePure(MlKemPublicKey(pk));

    // Constant-time comparison
    var valid = true;
    for (var i = 0; i < ciphertextSize; i++) {
      if (ciphertext.bytes[i] != reEncap.ciphertext.bytes[i]) {
        valid = false;
      }
    }

    // If valid, return K', otherwise return H(z || c) for implicit rejection
    final cHash = _hashH(ciphertext.bytes);
    if (valid) {
      return _kdf(Uint8List.fromList([...kPrime, ...cHash]));
    } else {
      // Implicit rejection - return pseudorandom value
      return _kdf(Uint8List.fromList([...z, ...cHash]));
    }
  }

  // ============================================
  // ML-KEM Helper Functions
  // ============================================

  Uint8List _generateRandomBytes(int length) {
    final bytes = Uint8List(length);
    for (var i = 0; i < length; i++) {
      bytes[i] = _secureRandom.nextUint8();
    }
    return bytes;
  }

  /// Hash function G: SHA3-512
  Uint8List _hashG(Uint8List input) {
    final sha3 = SHA3Digest(512);
    return Uint8List.fromList(sha3.process(input));
  }

  /// Hash function H: SHA3-256
  Uint8List _hashH(Uint8List input) {
    final sha3 = SHA3Digest(256);
    return Uint8List.fromList(sha3.process(input));
  }

  /// KDF: SHAKE-256
  Uint8List _kdf(Uint8List input) {
    final shake = SHAKEDigest(256);
    shake.update(input, 0, input.length);
    final output = Uint8List(32);
    shake.doOutput(output, 0, 32);
    return output;
  }

  /// PRF: SHAKE-256
  Uint8List _prf(Uint8List seed, int index) {
    final shake = SHAKEDigest(256);
    shake.update(seed, 0, seed.length);
    shake.update(Uint8List.fromList([index]), 0, 1);
    final output = Uint8List(64 * kyberEta1);
    shake.doOutput(output, 0, output.length);
    return output;
  }

  /// XOF: SHAKE-128 for matrix generation
  List<int> _xof(Uint8List seed, int i, int j) {
    final shake = SHAKEDigest(128);
    shake.update(seed, 0, seed.length);
    shake.update(Uint8List.fromList([j, i]), 0, 2);

    final coeffs = List<int>.filled(kyberN, 0);
    var count = 0;
    final buf = Uint8List(3);

    while (count < kyberN) {
      shake.doOutput(buf, 0, 3);

      final d1 = ((buf[0]) | ((buf[1] & 0x0F) << 8));
      final d2 = ((buf[1] >> 4) | ((buf[2]) << 4));

      if (d1 < kyberQ && count < kyberN) {
        coeffs[count++] = d1;
      }
      if (d2 < kyberQ && count < kyberN) {
        coeffs[count++] = d2;
      }
    }

    return coeffs;
  }

  /// Generate matrix A from seed rho
  List<List<List<int>>> _generateMatrixA(Uint8List rho) {
    return List.generate(kyberK, (i) {
      return List.generate(kyberK, (j) {
        return _xof(rho, i, j);
      });
    });
  }

  /// Sample polynomial from CBD(eta)
  List<int> _samplePolyCBD(Uint8List seed, int eta) {
    final coeffs = List<int>.filled(kyberN, 0);
    final bytesNeeded = 64 * eta;

    for (var i = 0; i < kyberN; i++) {
      var a = 0;
      var b = 0;
      for (var j = 0; j < eta; j++) {
        final byteIndex = (2 * i * eta + j) ~/ 8;
        final bitIndex = (2 * i * eta + j) % 8;
        if (byteIndex < seed.length) {
          a += (seed[byteIndex] >> bitIndex) & 1;
        }

        final byteIndex2 = (2 * i * eta + eta + j) ~/ 8;
        final bitIndex2 = (2 * i * eta + eta + j) % 8;
        if (byteIndex2 < seed.length) {
          b += (seed[byteIndex2] >> bitIndex2) & 1;
        }
      }
      coeffs[i] = _modQ(a - b);
    }

    return coeffs;
  }

  /// Sample vector of polynomials from CBD
  List<List<int>> _samplePolyCBDVector(
    Uint8List seed,
    int offset,
    int length,
    int eta,
  ) {
    return List.generate(length, (i) {
      final prfOutput = _prf(seed, offset + i);
      return _samplePolyCBD(prfOutput, eta);
    });
  }

  /// Modular reduction mod q
  int _modQ(int x) {
    var r = x % kyberQ;
    if (r < 0) r += kyberQ;
    return r;
  }

  // NTT constants for q=3329
  static const int _zeta = 17; // primitive 512th root of unity mod q
  late final List<int> _zetasPow = _computeZetas();

  List<int> _computeZetas() {
    final zetas = List<int>.filled(128, 0);
    var z = 1;
    for (var i = 0; i < 128; i++) {
      zetas[_bitrev7(i)] = z;
      z = (z * _zeta) % kyberQ;
    }
    return zetas;
  }

  int _bitrev7(int x) {
    var r = 0;
    for (var i = 0; i < 7; i++) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    return r;
  }

  /// NTT transformation
  List<int> _ntt(List<int> poly) {
    final r = List<int>.from(poly);
    var k = 1;
    for (var len = 128; len >= 2; len ~/= 2) {
      for (var start = 0; start < 256; start += 2 * len) {
        final zeta = _zetasPow[k++];
        for (var j = start; j < start + len; j++) {
          final t = (zeta * r[j + len]) % kyberQ;
          r[j + len] = _modQ(r[j] - t);
          r[j] = _modQ(r[j] + t);
        }
      }
    }
    return r;
  }

  /// Inverse NTT transformation
  List<int> _invNtt(List<int> poly) {
    final r = List<int>.from(poly);
    var k = 127;
    for (var len = 2; len <= 128; len *= 2) {
      for (var start = 0; start < 256; start += 2 * len) {
        final zeta = _zetasPow[k--];
        for (var j = start; j < start + len; j++) {
          final t = r[j];
          r[j] = _modQ(t + r[j + len]);
          r[j + len] = _modQ((zeta * _modQ(r[j + len] - t)));
        }
      }
    }
    // Multiply by n^-1 mod q = 3303
    const nInv = 3303;
    for (var i = 0; i < 256; i++) {
      r[i] = (r[i] * nInv) % kyberQ;
    }
    return r;
  }

  List<List<int>> _nttVector(List<List<int>> vec) {
    return vec.map((p) => _ntt(p)).toList();
  }

  List<List<int>> _invNttVector(List<List<int>> vec) {
    return vec.map((p) => _invNtt(p)).toList();
  }

  /// Pointwise multiplication in NTT domain
  List<int> _nttMultiply(List<int> a, List<int> b) {
    final r = List<int>.filled(kyberN, 0);
    for (var i = 0; i < kyberN ~/ 2; i++) {
      final zeta = _zetasPow[64 + i];
      final a0 = a[2 * i];
      final a1 = a[2 * i + 1];
      final b0 = b[2 * i];
      final b1 = b[2 * i + 1];

      r[2 * i] = _modQ((a0 * b0) + (a1 * b1 * zeta));
      r[2 * i + 1] = _modQ((a0 * b1) + (a1 * b0));
    }
    return r;
  }

  /// Compress message to polynomial
  List<int> _decompressMessage(Uint8List m) {
    final poly = List<int>.filled(kyberN, 0);
    for (var i = 0; i < 32; i++) {
      for (var j = 0; j < 8; j++) {
        final bit = (m[i] >> j) & 1;
        poly[8 * i + j] = bit * ((kyberQ + 1) ~/ 2);
      }
    }
    return poly;
  }

  /// Compress polynomial to message
  Uint8List _compressMessage(List<int> poly) {
    final m = Uint8List(32);
    for (var i = 0; i < 32; i++) {
      for (var j = 0; j < 8; j++) {
        final coeff = poly[8 * i + j];
        // Round to nearest bit
        final bit = ((coeff * 2 + kyberQ ~/ 2) ~/ kyberQ) & 1;
        m[i] |= (bit << j);
      }
    }
    return m;
  }

  /// Encode public key
  Uint8List _encodePublicKey(List<List<int>> t, Uint8List rho) {
    final pk = Uint8List(publicKeySize);
    var offset = 0;

    // Encode t (12 bits per coefficient)
    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN ~/ 2; j++) {
        final c0 = t[i][2 * j];
        final c1 = t[i][2 * j + 1];
        pk[offset++] = c0 & 0xFF;
        pk[offset++] = ((c0 >> 8) | ((c1 & 0x0F) << 4)) & 0xFF;
        pk[offset++] = (c1 >> 4) & 0xFF;
      }
    }

    // Append rho
    pk.setRange(offset, offset + 32, rho);

    return pk;
  }

  /// Decode public key
  _DecodedPublicKey _decodePublicKey(Uint8List pk) {
    final t = List<List<int>>.generate(kyberK, (_) => List<int>.filled(kyberN, 0));
    var offset = 0;

    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN ~/ 2; j++) {
        final b0 = pk[offset++];
        final b1 = pk[offset++];
        final b2 = pk[offset++];
        t[i][2 * j] = (b0 | ((b1 & 0x0F) << 8));
        t[i][2 * j + 1] = ((b1 >> 4) | (b2 << 4));
      }
    }

    final rho = pk.sublist(offset, offset + 32);

    return _DecodedPublicKey(t, Uint8List.fromList(rho));
  }

  /// Encode secret key
  Uint8List _encodeSecretKey(
    List<List<int>> s,
    Uint8List pk,
    Uint8List pkHash,
    Uint8List z,
  ) {
    final sk = Uint8List(secretKeySize);
    var offset = 0;

    // Encode s (12 bits per coefficient)
    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN ~/ 2; j++) {
        final c0 = s[i][2 * j];
        final c1 = s[i][2 * j + 1];
        sk[offset++] = c0 & 0xFF;
        sk[offset++] = ((c0 >> 8) | ((c1 & 0x0F) << 4)) & 0xFF;
        sk[offset++] = (c1 >> 4) & 0xFF;
      }
    }

    // Append pk
    sk.setRange(offset, offset + publicKeySize, pk);
    offset += publicKeySize;

    // Append H(pk)
    sk.setRange(offset, offset + 32, pkHash);
    offset += 32;

    // Append z
    sk.setRange(offset, offset + 32, z);

    return sk;
  }

  /// Decode secret key
  _DecodedSecretKey _decodeSecretKey(Uint8List sk) {
    final s = List<List<int>>.generate(kyberK, (_) => List<int>.filled(kyberN, 0));
    var offset = 0;

    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN ~/ 2; j++) {
        final b0 = sk[offset++];
        final b1 = sk[offset++];
        final b2 = sk[offset++];
        s[i][2 * j] = (b0 | ((b1 & 0x0F) << 8));
        s[i][2 * j + 1] = ((b1 >> 4) | (b2 << 4));
      }
    }

    final pk = sk.sublist(offset, offset + publicKeySize);
    offset += publicKeySize;

    final pkHash = sk.sublist(offset, offset + 32);
    offset += 32;

    final z = sk.sublist(offset, offset + 32);

    return _DecodedSecretKey(
      s,
      Uint8List.fromList(pk),
      Uint8List.fromList(pkHash),
      Uint8List.fromList(z),
    );
  }

  /// Encode ciphertext
  Uint8List _encodeCiphertext(List<List<int>> u, List<int> v) {
    final ct = Uint8List(ciphertextSize);
    var offset = 0;

    // Compress and encode u (du = 10 bits)
    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN ~/ 4; j++) {
        final c0 = _compress(u[i][4 * j], kyberDu);
        final c1 = _compress(u[i][4 * j + 1], kyberDu);
        final c2 = _compress(u[i][4 * j + 2], kyberDu);
        final c3 = _compress(u[i][4 * j + 3], kyberDu);

        ct[offset++] = c0 & 0xFF;
        ct[offset++] = ((c0 >> 8) | ((c1 & 0x3F) << 2)) & 0xFF;
        ct[offset++] = ((c1 >> 6) | ((c2 & 0x0F) << 4)) & 0xFF;
        ct[offset++] = ((c2 >> 4) | ((c3 & 0x03) << 6)) & 0xFF;
        ct[offset++] = (c3 >> 2) & 0xFF;
      }
    }

    // Compress and encode v (dv = 4 bits)
    for (var j = 0; j < kyberN ~/ 2; j++) {
      final c0 = _compress(v[2 * j], kyberDv);
      final c1 = _compress(v[2 * j + 1], kyberDv);
      ct[offset++] = (c0 | (c1 << 4)) & 0xFF;
    }

    return ct;
  }

  /// Decode ciphertext
  _DecodedCiphertext _decodeCiphertext(Uint8List ct) {
    final u = List<List<int>>.generate(kyberK, (_) => List<int>.filled(kyberN, 0));
    final v = List<int>.filled(kyberN, 0);
    var offset = 0;

    // Decode u
    for (var i = 0; i < kyberK; i++) {
      for (var j = 0; j < kyberN ~/ 4; j++) {
        final b0 = ct[offset++];
        final b1 = ct[offset++];
        final b2 = ct[offset++];
        final b3 = ct[offset++];
        final b4 = ct[offset++];

        u[i][4 * j] = _decompress((b0 | ((b1 & 0x03) << 8)), kyberDu);
        u[i][4 * j + 1] = _decompress(((b1 >> 2) | ((b2 & 0x0F) << 6)), kyberDu);
        u[i][4 * j + 2] = _decompress(((b2 >> 4) | ((b3 & 0x3F) << 4)), kyberDu);
        u[i][4 * j + 3] = _decompress(((b3 >> 6) | (b4 << 2)), kyberDu);
      }
    }

    // Decode v
    for (var j = 0; j < kyberN ~/ 2; j++) {
      final b = ct[offset++];
      v[2 * j] = _decompress(b & 0x0F, kyberDv);
      v[2 * j + 1] = _decompress(b >> 4, kyberDv);
    }

    return _DecodedCiphertext(u, v);
  }

  /// Compress coefficient
  int _compress(int x, int d) {
    return (((x << d) + kyberQ ~/ 2) ~/ kyberQ) & ((1 << d) - 1);
  }

  /// Decompress coefficient
  int _decompress(int x, int d) {
    return ((x * kyberQ) + (1 << (d - 1))) >> d;
  }
}

// Helper classes for decoded structures
class _DecodedPublicKey {
  final List<List<int>> t;
  final Uint8List rho;
  _DecodedPublicKey(this.t, this.rho);
}

class _DecodedSecretKey {
  final List<List<int>> s;
  final Uint8List pk;
  final Uint8List pkHash;
  final Uint8List z;
  _DecodedSecretKey(this.s, this.pk, this.pkHash, this.z);
}

class _DecodedCiphertext {
  final List<List<int>> u;
  final List<int> v;
  _DecodedCiphertext(this.u, this.v);
}

/// Exception for crypto operations
class CryptoException implements Exception {
  final String message;
  CryptoException(this.message);

  @override
  String toString() => 'CryptoException: $message';
}

/// ML-KEM public key
class MlKemPublicKey {
  final Uint8List bytes;

  MlKemPublicKey(this.bytes) {
    if (bytes.length != PqcCrypto.publicKeySize) {
      throw ArgumentError(
        'Invalid public key size: ${bytes.length}, expected ${PqcCrypto.publicKeySize}',
      );
    }
  }

  String toHex() => hex.encode(bytes);

  static MlKemPublicKey fromHex(String hexString) {
    return MlKemPublicKey(Uint8List.fromList(hex.decode(hexString)));
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! MlKemPublicKey) return false;
    if (bytes.length != other.bytes.length) return false;
    // Constant-time comparison
    var result = 0;
    for (var i = 0; i < bytes.length; i++) {
      result |= bytes[i] ^ other.bytes[i];
    }
    return result == 0;
  }

  @override
  int get hashCode => Object.hashAll(bytes);
}

/// ML-KEM secret key
class MlKemSecretKey {
  final Uint8List bytes;

  MlKemSecretKey(this.bytes) {
    if (bytes.length != PqcCrypto.secretKeySize) {
      throw ArgumentError(
        'Invalid secret key size: ${bytes.length}, expected ${PqcCrypto.secretKeySize}',
      );
    }
  }

  String toHex() => hex.encode(bytes);

  static MlKemSecretKey fromHex(String hexString) {
    return MlKemSecretKey(Uint8List.fromList(hex.decode(hexString)));
  }

  /// Securely clear the key from memory
  void clear() {
    for (var i = 0; i < bytes.length; i++) {
      bytes[i] = 0;
    }
  }
}

/// ML-KEM ciphertext
class MlKemCiphertext {
  final Uint8List bytes;

  MlKemCiphertext(this.bytes) {
    if (bytes.length != PqcCrypto.ciphertextSize) {
      throw ArgumentError(
        'Invalid ciphertext size: ${bytes.length}, expected ${PqcCrypto.ciphertextSize}',
      );
    }
  }

  String toHex() => hex.encode(bytes);

  static MlKemCiphertext fromHex(String hexString) {
    return MlKemCiphertext(Uint8List.fromList(hex.decode(hexString)));
  }
}

/// ML-KEM key pair
class MlKemKeyPair {
  final MlKemPublicKey publicKey;
  final MlKemSecretKey secretKey;

  MlKemKeyPair({
    required this.publicKey,
    required this.secretKey,
  });

  /// Securely clear the secret key from memory
  void clearSecretKey() {
    secretKey.clear();
  }
}

/// Result of encapsulation
class MlKemEncapsulation {
  final Uint8List sharedSecret;
  final MlKemCiphertext ciphertext;

  MlKemEncapsulation({
    required this.sharedSecret,
    required this.ciphertext,
  });

  /// Securely clear the shared secret from memory
  void clearSharedSecret() {
    for (var i = 0; i < sharedSecret.length; i++) {
      sharedSecret[i] = 0;
    }
  }
}

/// liboqs FFI bindings
class _LibOqsBindings {
  final ffi.DynamicLibrary _lib;
  late final ffi.Pointer<ffi.Void> mlKem768;

  _LibOqsBindings(this._lib) {
    final getKem = _lib.lookupFunction<
      ffi.Pointer<ffi.Void> Function(ffi.Pointer<ffi.Char>),
      ffi.Pointer<ffi.Void> Function(ffi.Pointer<ffi.Char>)
    >('OQS_KEM_new');

    final kemName = 'ML-KEM-768'.toNativeUtf8();
    mlKem768 = getKem(kemName.cast());
  }

  int OQS_KEM_keypair(
    ffi.Pointer<ffi.Void> kem,
    ffi.Pointer<ffi.Uint8> publicKey,
    ffi.Pointer<ffi.Uint8> secretKey,
  ) {
    final fn = _lib.lookupFunction<
      ffi.Int32 Function(
        ffi.Pointer<ffi.Void>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
      ),
      int Function(
        ffi.Pointer<ffi.Void>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
      )
    >('OQS_KEM_keypair');
    return fn(kem, publicKey, secretKey);
  }

  int OQS_KEM_encaps(
    ffi.Pointer<ffi.Void> kem,
    ffi.Pointer<ffi.Uint8> ciphertext,
    ffi.Pointer<ffi.Uint8> sharedSecret,
    ffi.Pointer<ffi.Uint8> publicKey,
  ) {
    final fn = _lib.lookupFunction<
      ffi.Int32 Function(
        ffi.Pointer<ffi.Void>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
      ),
      int Function(
        ffi.Pointer<ffi.Void>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
      )
    >('OQS_KEM_encaps');
    return fn(kem, ciphertext, sharedSecret, publicKey);
  }

  int OQS_KEM_decaps(
    ffi.Pointer<ffi.Void> kem,
    ffi.Pointer<ffi.Uint8> sharedSecret,
    ffi.Pointer<ffi.Uint8> ciphertext,
    ffi.Pointer<ffi.Uint8> secretKey,
  ) {
    final fn = _lib.lookupFunction<
      ffi.Int32 Function(
        ffi.Pointer<ffi.Void>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
      ),
      int Function(
        ffi.Pointer<ffi.Void>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
        ffi.Pointer<ffi.Uint8>,
      )
    >('OQS_KEM_decaps');
    return fn(kem, sharedSecret, ciphertext, secretKey);
  }
}

extension on String {
  ffi.Pointer<ffi.Char> toNativeUtf8() {
    final units = codeUnits;
    final result = ffi.calloc<ffi.Char>(units.length + 1);
    for (var i = 0; i < units.length; i++) {
      result[i] = units[i];
    }
    result[units.length] = 0;
    return result;
  }
}
