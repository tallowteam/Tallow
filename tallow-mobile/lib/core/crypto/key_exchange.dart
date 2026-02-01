import 'dart:typed_data';
import 'package:cryptography/cryptography.dart' as crypto;
import 'package:convert/convert.dart';

import 'pqc_crypto.dart';
import '../storage/secure_storage.dart';
import '../../shared/utils/secure_logger.dart';

final _logger = SecureLogger('KeyExchange');

/// Key exchange service for hybrid PQC + X25519 key exchange
class KeyExchangeService {
  final _pqc = PqcCrypto();
  final _x25519 = crypto.X25519();

  /// Generate a new hybrid identity key pair
  Future<HybridKeyPair> generateIdentityKeyPair() async {
    _logger.i('Generating hybrid identity key pair...');

    // Generate ML-KEM-768 key pair
    final mlKemKeyPair = await _pqc.generateKeyPair();

    // Generate X25519 key pair
    final x25519KeyPair = await _x25519.newKeyPair();
    final x25519Public = await x25519KeyPair.extractPublicKey();
    final x25519Private = await x25519KeyPair.extractPrivateKeyBytes();

    _logger.i('Hybrid key pair generated successfully');
    _logger.d('ML-KEM public key: ${mlKemKeyPair.publicKey.toHex().substring(0, 32)}...');
    _logger.d('X25519 public key: ${hex.encode(x25519Public.bytes)}');

    return HybridKeyPair.fromKeys(
      mlKemPublicKey: mlKemKeyPair.publicKey,
      mlKemSecretKey: mlKemKeyPair.secretKey,
      x25519PublicKey: Uint8List.fromList(x25519Public.bytes),
      x25519PrivateKey: Uint8List.fromList(x25519Private),
    );
  }

  /// Perform hybrid key exchange with a peer
  ///
  /// Combines ML-KEM-768 encapsulation with X25519 ECDH
  /// Returns a 32-byte shared secret derived via HKDF
  Future<HybridKeyExchangeResult> performKeyExchange({
    required HybridKeyPair localKeyPair,
    required HybridPublicKeys peerPublicKeys,
    required bool isInitiator,
  }) async {
    _logger.i('Performing hybrid key exchange (initiator: $isInitiator)...');

    // 1. ML-KEM key exchange
    final Uint8List mlKemSecret;
    final MlKemCiphertext? ciphertext;

    if (isInitiator) {
      // Initiator encapsulates to peer's public key
      final peerMlKemPublic = MlKemPublicKey.fromHex(peerPublicKeys.mlKemPublicKey);
      final encapsulation = await _pqc.encapsulate(peerMlKemPublic);
      mlKemSecret = encapsulation.sharedSecret;
      ciphertext = encapsulation.ciphertext;
    } else {
      // Responder will decapsulate (ciphertext provided externally)
      // This branch is used differently - see performKeyExchangeResponder
      throw UnsupportedError('Use performKeyExchangeResponder for responder side');
    }

    // 2. X25519 key exchange
    final x25519KeyPair = await _x25519.newKeyPairFromSeed(
      await localKeyPair.exportX25519Keys().then((k) => k.privateKey),
    );
    final peerX25519Public = crypto.SimplePublicKey(
      hex.decode(peerPublicKeys.x25519PublicKey),
      type: crypto.KeyPairType.x25519,
    );

    final x25519SharedSecret = await _x25519.sharedSecretKey(
      keyPair: x25519KeyPair,
      remotePublicKey: peerX25519Public,
    );
    final x25519SecretBytes = await x25519SharedSecret.extractBytes();

    // 3. Combine secrets using HKDF
    final combinedSecret = _combineSecrets(
      mlKemSecret: mlKemSecret,
      x25519Secret: Uint8List.fromList(x25519SecretBytes),
      isInitiator: isInitiator,
    );

    final sessionKey = await _deriveSessionKey(combinedSecret);

    _logger.i('Hybrid key exchange completed');

    return HybridKeyExchangeResult(
      sessionKey: sessionKey,
      mlKemCiphertext: ciphertext,
    );
  }

  /// Perform key exchange as responder (decapsulating received ciphertext)
  Future<Uint8List> performKeyExchangeResponder({
    required HybridKeyPair localKeyPair,
    required HybridPublicKeys peerPublicKeys,
    required MlKemCiphertext mlKemCiphertext,
  }) async {
    _logger.i('Performing hybrid key exchange (responder)...');

    // 1. ML-KEM decapsulation
    final mlKemSecret = await _pqc.decapsulate(
      mlKemCiphertext,
      localKeyPair.mlKemSecretKey,
    );

    // 2. X25519 key exchange
    final x25519Keys = await localKeyPair.exportX25519Keys();
    final x25519KeyPair = await _x25519.newKeyPairFromSeed(x25519Keys.privateKey);
    final peerX25519Public = crypto.SimplePublicKey(
      hex.decode(peerPublicKeys.x25519PublicKey),
      type: crypto.KeyPairType.x25519,
    );

    final x25519SharedSecret = await _x25519.sharedSecretKey(
      keyPair: x25519KeyPair,
      remotePublicKey: peerX25519Public,
    );
    final x25519SecretBytes = await x25519SharedSecret.extractBytes();

    // 3. Combine secrets using HKDF
    final combinedSecret = _combineSecrets(
      mlKemSecret: mlKemSecret,
      x25519Secret: Uint8List.fromList(x25519SecretBytes),
      isInitiator: false,
    );

    final sessionKey = await _deriveSessionKey(combinedSecret);

    _logger.i('Hybrid key exchange (responder) completed');

    return sessionKey;
  }

  /// Combine ML-KEM and X25519 secrets
  Uint8List _combineSecrets({
    required Uint8List mlKemSecret,
    required Uint8List x25519Secret,
    required bool isInitiator,
  }) {
    // Concatenate secrets with role binding to prevent reflection attacks
    final rolePrefix = isInitiator ? [0x01] : [0x02];
    return Uint8List.fromList([
      ...rolePrefix,
      ...mlKemSecret,
      ...x25519Secret,
    ]);
  }

  /// Derive session key using HKDF
  Future<Uint8List> _deriveSessionKey(Uint8List combinedSecret) async {
    final hkdf = crypto.Hkdf(
      hmac: crypto.Hmac.sha256(),
      outputLength: 32,
    );

    final derivedKey = await hkdf.deriveKey(
      secretKey: crypto.SecretKey(combinedSecret),
      info: 'tallow-session-key-v1'.codeUnits,
      nonce: Uint8List(0),
    );

    return Uint8List.fromList(await derivedKey.extractBytes());
  }

  /// Verify key fingerprint for TOFU (Trust On First Use)
  String generateFingerprint(HybridPublicKeys publicKeys) {
    // Combine both public keys and hash
    final combined = Uint8List.fromList([
      ...hex.decode(publicKeys.mlKemPublicKey),
      ...hex.decode(publicKeys.x25519PublicKey),
    ]);

    final sha256 = crypto.Sha256();
    // Use synchronous hash for fingerprint
    final digest = sha256.hashSync(combined);

    // Format as human-readable fingerprint (first 16 bytes as hex with colons)
    final bytes = digest.bytes.take(16).toList();
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0').toUpperCase())
        .join(':');
  }

  /// Generate a short verification code for manual verification
  String generateVerificationCode(Uint8List sessionKey) {
    // Take first 4 bytes and convert to 6-digit code
    final value = (sessionKey[0] << 24) |
        (sessionKey[1] << 16) |
        (sessionKey[2] << 8) |
        sessionKey[3];
    return (value.abs() % 1000000).toString().padLeft(6, '0');
  }
}

/// Result of hybrid key exchange
class HybridKeyExchangeResult {
  final Uint8List sessionKey;
  final MlKemCiphertext? mlKemCiphertext;

  HybridKeyExchangeResult({
    required this.sessionKey,
    this.mlKemCiphertext,
  });

  /// Securely clear the session key
  void clear() {
    for (var i = 0; i < sessionKey.length; i++) {
      sessionKey[i] = 0;
    }
  }
}
