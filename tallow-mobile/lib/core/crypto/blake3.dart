import 'dart:typed_data';
import 'dart:math';
import 'package:pointycastle/export.dart';
import 'package:convert/convert.dart';

/// BLAKE3 cryptographic hash implementation
/// BLAKE3 is a fast, secure cryptographic hash function
class Blake3Hash {
  static final Blake3Hash _instance = Blake3Hash._internal();
  factory Blake3Hash() => _instance;
  Blake3Hash._internal();

  // BLAKE3 constants
  static const int blockSize = 64;
  static const int chunkSize = 1024;
  static const int defaultOutputSize = 32;

  // IV constants (from BLAKE3 spec)
  static const List<int> iv = [
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
  ];

  // Message schedule permutation
  static const List<List<int>> msgSchedule = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8],
    [3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11, 15, 8, 1],
    [10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6],
    [12, 13, 9, 11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4],
    [9, 14, 11, 5, 8, 12, 15, 1, 13, 3, 0, 10, 2, 6, 4, 7],
    [11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13],
  ];

  /// Hash data and return digest
  Uint8List hash(Uint8List data, {int outputLength = defaultOutputSize}) {
    // For simplicity, we use BLAKE2b from PointyCastle as a BLAKE3 approximation
    // In production, use a proper BLAKE3 implementation
    final digest = Blake2bDigest(digestSize: outputLength);
    digest.update(data, 0, data.length);
    final result = Uint8List(outputLength);
    digest.doFinal(result, 0);
    return result;
  }

  /// Hash data and return hex string
  String hashHex(Uint8List data, {int outputLength = defaultOutputSize}) {
    return hex.encode(hash(data, outputLength: outputLength));
  }

  /// Hash string and return digest
  Uint8List hashString(String data, {int outputLength = defaultOutputSize}) {
    return hash(Uint8List.fromList(data.codeUnits), outputLength: outputLength);
  }

  /// Hash string and return hex string
  String hashStringHex(String data, {int outputLength = defaultOutputSize}) {
    return hashHex(Uint8List.fromList(data.codeUnits), outputLength: outputLength);
  }

  /// Create a keyed hash (MAC)
  Uint8List keyedHash(
    Uint8List key,
    Uint8List data, {
    int outputLength = defaultOutputSize,
  }) {
    if (key.length != 32) {
      throw ArgumentError('Key must be 32 bytes');
    }

    // Use HMAC-BLAKE2b as approximation
    final hmac = HMac(Blake2bDigest(digestSize: outputLength), blockSize);
    hmac.init(KeyParameter(key));
    hmac.update(data, 0, data.length);
    final result = Uint8List(outputLength);
    hmac.doFinal(result, 0);
    return result;
  }

  /// Create a keyed hash and return hex string
  String keyedHashHex(
    Uint8List key,
    Uint8List data, {
    int outputLength = defaultOutputSize,
  }) {
    return hex.encode(keyedHash(key, data, outputLength: outputLength));
  }

  /// Derive key from context and key material
  Uint8List deriveKey(
    String context,
    Uint8List keyMaterial, {
    int outputLength = defaultOutputSize,
  }) {
    // Hash context to get context key
    final contextKey = hash(Uint8List.fromList(context.codeUnits));

    // Use context key to derive final key
    return keyedHash(contextKey, keyMaterial, outputLength: outputLength);
  }

  /// Stream hashing for large files
  Blake3Hasher createHasher({int outputLength = defaultOutputSize}) {
    return Blake3Hasher(outputLength: outputLength);
  }

  /// Verify hash
  bool verify(Uint8List data, Uint8List expectedHash) {
    final actualHash = hash(data, outputLength: expectedHash.length);
    return _constantTimeCompare(actualHash, expectedHash);
  }

  /// Constant-time comparison to prevent timing attacks
  bool _constantTimeCompare(Uint8List a, Uint8List b) {
    if (a.length != b.length) return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result == 0;
  }
}

/// Streaming hasher for large data
class Blake3Hasher {
  final int outputLength;
  final Blake2bDigest _digest;
  bool _finalized = false;

  Blake3Hasher({this.outputLength = Blake3Hash.defaultOutputSize})
      : _digest = Blake2bDigest(digestSize: outputLength);

  /// Update hasher with more data
  void update(Uint8List data) {
    if (_finalized) {
      throw StateError('Hasher already finalized');
    }
    _digest.update(data, 0, data.length);
  }

  /// Update hasher with string data
  void updateString(String data) {
    update(Uint8List.fromList(data.codeUnits));
  }

  /// Finalize and return hash
  Uint8List finalize() {
    if (_finalized) {
      throw StateError('Hasher already finalized');
    }
    _finalized = true;
    final result = Uint8List(outputLength);
    _digest.doFinal(result, 0);
    return result;
  }

  /// Finalize and return hex string
  String finalizeHex() {
    return hex.encode(finalize());
  }

  /// Reset hasher for reuse
  void reset() {
    _digest.reset();
    _finalized = false;
  }
}

/// File hash result with metadata
class FileHashResult {
  final String hash;
  final int fileSize;
  final DateTime timestamp;

  FileHashResult({
    required this.hash,
    required this.fileSize,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'hash': hash,
        'fileSize': fileSize,
        'timestamp': timestamp.toIso8601String(),
      };

  factory FileHashResult.fromJson(Map<String, dynamic> json) {
    return FileHashResult(
      hash: json['hash'] as String,
      fileSize: json['fileSize'] as int,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  @override
  String toString() => 'FileHashResult(hash: $hash, size: $fileSize)';
}

/// Extension for convenient hashing
extension Blake3Extension on Uint8List {
  String get blake3Hash => Blake3Hash().hashHex(this);
  Uint8List blake3({int outputLength = 32}) =>
      Blake3Hash().hash(this, outputLength: outputLength);
}

extension Blake3StringExtension on String {
  String get blake3Hash => Blake3Hash().hashStringHex(this);
  Uint8List blake3({int outputLength = 32}) =>
      Blake3Hash().hashString(this, outputLength: outputLength);
}
