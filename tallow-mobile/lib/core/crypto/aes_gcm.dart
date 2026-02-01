import 'dart:typed_data';
import 'dart:math';
import 'package:cryptography/cryptography.dart';
import 'package:convert/convert.dart';

/// AES-256-GCM encryption service for secure data encryption
class AesGcmCrypto {
  static final AesGcmCrypto _instance = AesGcmCrypto._internal();
  factory AesGcmCrypto() => _instance;
  AesGcmCrypto._internal();

  // AES-256-GCM parameters
  static const int keySize = 32; // 256 bits
  static const int nonceSize = 12; // 96 bits (recommended for GCM)
  static const int tagSize = 16; // 128 bits

  final _algorithm = AesGcm.with256bits();
  final _random = Random.secure();

  /// Generate a random 256-bit key
  Future<Uint8List> generateKey() async {
    final key = Uint8List(keySize);
    for (var i = 0; i < keySize; i++) {
      key[i] = _random.nextInt(256);
    }
    return key;
  }

  /// Generate a random 96-bit nonce
  Uint8List generateNonce() {
    final nonce = Uint8List(nonceSize);
    for (var i = 0; i < nonceSize; i++) {
      nonce[i] = _random.nextInt(256);
    }
    return nonce;
  }

  /// Encrypt data with AES-256-GCM
  /// Returns: nonce (12 bytes) + ciphertext + tag (16 bytes)
  Future<Uint8List> encrypt(
    Uint8List plaintext,
    Uint8List key, {
    Uint8List? nonce,
    Uint8List? additionalData,
  }) async {
    if (key.length != keySize) {
      throw ArgumentError('Key must be $keySize bytes');
    }

    final secretKey = SecretKey(key);
    final iv = nonce ?? generateNonce();

    final secretBox = await _algorithm.encrypt(
      plaintext,
      secretKey: secretKey,
      nonce: iv,
      aad: additionalData ?? Uint8List(0),
    );

    // Combine: nonce + ciphertext + tag
    final result = Uint8List(nonceSize + secretBox.cipherText.length + secretBox.mac.bytes.length);
    result.setRange(0, nonceSize, iv);
    result.setRange(nonceSize, nonceSize + secretBox.cipherText.length, secretBox.cipherText);
    result.setRange(
      nonceSize + secretBox.cipherText.length,
      result.length,
      secretBox.mac.bytes,
    );

    return result;
  }

  /// Decrypt data with AES-256-GCM
  /// Input: nonce (12 bytes) + ciphertext + tag (16 bytes)
  Future<Uint8List> decrypt(
    Uint8List cipherdata,
    Uint8List key, {
    Uint8List? additionalData,
  }) async {
    if (key.length != keySize) {
      throw ArgumentError('Key must be $keySize bytes');
    }

    if (cipherdata.length < nonceSize + tagSize) {
      throw ArgumentError('Cipherdata too short');
    }

    final secretKey = SecretKey(key);

    // Extract: nonce + ciphertext + tag
    final nonce = cipherdata.sublist(0, nonceSize);
    final ciphertext = cipherdata.sublist(nonceSize, cipherdata.length - tagSize);
    final tag = cipherdata.sublist(cipherdata.length - tagSize);

    final secretBox = SecretBox(
      ciphertext,
      nonce: nonce,
      mac: Mac(tag),
    );

    final plaintext = await _algorithm.decrypt(
      secretBox,
      secretKey: secretKey,
      aad: additionalData ?? Uint8List(0),
    );

    return Uint8List.fromList(plaintext);
  }

  /// Encrypt a string and return base64-encoded ciphertext
  Future<String> encryptString(
    String plaintext,
    Uint8List key, {
    Uint8List? additionalData,
  }) async {
    final plaintextBytes = Uint8List.fromList(plaintext.codeUnits);
    final cipherdata = await encrypt(plaintextBytes, key, additionalData: additionalData);
    return hex.encode(cipherdata);
  }

  /// Decrypt a base64-encoded ciphertext and return string
  Future<String> decryptString(
    String ciphertext,
    Uint8List key, {
    Uint8List? additionalData,
  }) async {
    final cipherdata = Uint8List.fromList(hex.decode(ciphertext));
    final plaintext = await decrypt(cipherdata, key, additionalData: additionalData);
    return String.fromCharCodes(plaintext);
  }

  /// Encrypt file data in chunks for streaming
  Stream<Uint8List> encryptStream(
    Stream<Uint8List> input,
    Uint8List key, {
    int chunkSize = 64 * 1024, // 64KB chunks
  }) async* {
    if (key.length != keySize) {
      throw ArgumentError('Key must be $keySize bytes');
    }

    int chunkIndex = 0;
    await for (final chunk in input) {
      // Use chunk index as part of nonce to ensure uniqueness
      final nonce = _generateChunkNonce(chunkIndex);
      final encrypted = await encrypt(chunk, key, nonce: nonce);
      yield encrypted;
      chunkIndex++;
    }
  }

  /// Decrypt file data in chunks for streaming
  Stream<Uint8List> decryptStream(
    Stream<Uint8List> input,
    Uint8List key,
  ) async* {
    if (key.length != keySize) {
      throw ArgumentError('Key must be $keySize bytes');
    }

    await for (final chunk in input) {
      final decrypted = await decrypt(chunk, key);
      yield decrypted;
    }
  }

  /// Generate a nonce for a specific chunk index
  Uint8List _generateChunkNonce(int chunkIndex) {
    final nonce = Uint8List(nonceSize);
    // Use first 4 bytes for random prefix
    for (var i = 0; i < 4; i++) {
      nonce[i] = _random.nextInt(256);
    }
    // Use last 8 bytes for chunk counter
    final counter = chunkIndex;
    nonce[4] = (counter >> 56) & 0xFF;
    nonce[5] = (counter >> 48) & 0xFF;
    nonce[6] = (counter >> 40) & 0xFF;
    nonce[7] = (counter >> 32) & 0xFF;
    nonce[8] = (counter >> 24) & 0xFF;
    nonce[9] = (counter >> 16) & 0xFF;
    nonce[10] = (counter >> 8) & 0xFF;
    nonce[11] = counter & 0xFF;
    return nonce;
  }

  /// Derive an encryption key from a password using Argon2
  Future<Uint8List> deriveKeyFromPassword(
    String password,
    Uint8List salt, {
    int iterations = 3,
    int memory = 65536, // 64MB
    int parallelism = 4,
  }) async {
    final argon2 = Argon2id(
      parallelism: parallelism,
      memory: memory,
      iterations: iterations,
      hashLength: keySize,
    );

    final result = await argon2.deriveKey(
      secretKey: SecretKey(Uint8List.fromList(password.codeUnits)),
      nonce: salt,
    );

    return Uint8List.fromList(await result.extractBytes());
  }

  /// Generate a random salt for password derivation
  Uint8List generateSalt({int length = 16}) {
    final salt = Uint8List(length);
    for (var i = 0; i < length; i++) {
      salt[i] = _random.nextInt(256);
    }
    return salt;
  }
}

/// Encrypted data container with metadata
class EncryptedData {
  final Uint8List ciphertext;
  final Uint8List nonce;
  final Uint8List tag;
  final Uint8List? additionalData;

  EncryptedData({
    required this.ciphertext,
    required this.nonce,
    required this.tag,
    this.additionalData,
  });

  /// Combine all parts into a single byte array
  Uint8List toBytes() {
    final result = Uint8List(nonce.length + ciphertext.length + tag.length);
    result.setRange(0, nonce.length, nonce);
    result.setRange(nonce.length, nonce.length + ciphertext.length, ciphertext);
    result.setRange(nonce.length + ciphertext.length, result.length, tag);
    return result;
  }

  /// Parse from combined byte array
  static EncryptedData fromBytes(Uint8List data) {
    const nonceSize = AesGcmCrypto.nonceSize;
    const tagSize = AesGcmCrypto.tagSize;

    if (data.length < nonceSize + tagSize) {
      throw ArgumentError('Data too short');
    }

    return EncryptedData(
      nonce: data.sublist(0, nonceSize),
      ciphertext: data.sublist(nonceSize, data.length - tagSize),
      tag: data.sublist(data.length - tagSize),
    );
  }

  String toHex() => hex.encode(toBytes());

  static EncryptedData fromHex(String hexString) {
    return fromBytes(Uint8List.fromList(hex.decode(hexString)));
  }
}
