import 'dart:async';
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:logger/logger.dart';

/// Transfer history storage using SQLite
class TransferHistoryService {
  static final TransferHistoryService _instance = TransferHistoryService._internal();
  factory TransferHistoryService() => _instance;
  TransferHistoryService._internal();

  final _logger = Logger();

  Database? _database;
  bool _initialized = false;

  static const String _tableName = 'transfer_history';
  static const String _dbName = 'tallow_history.db';
  static const int _dbVersion = 1;

  /// Initialize the database
  Future<void> initialize() async {
    if (_initialized) return;

    final documentsDirectory = await getApplicationDocumentsDirectory();
    final path = join(documentsDirectory.path, _dbName);

    _database = await openDatabase(
      path,
      version: _dbVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );

    _initialized = true;
    _logger.i('Transfer history database initialized');
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $_tableName (
        id TEXT PRIMARY KEY,
        fileName TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        fileType TEXT,
        filePath TEXT,
        direction TEXT NOT NULL,
        peerId TEXT NOT NULL,
        peerName TEXT NOT NULL,
        status TEXT NOT NULL,
        progress REAL DEFAULT 0,
        bytesTransferred INTEGER DEFAULT 0,
        startTime TEXT NOT NULL,
        endTime TEXT,
        duration INTEGER,
        averageSpeed REAL,
        errorMessage TEXT,
        isEncrypted INTEGER DEFAULT 1,
        encryptionType TEXT,
        checksum TEXT,
        metadata TEXT
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_start_time ON $_tableName (startTime)
    ''');

    await db.execute('''
      CREATE INDEX idx_peer_id ON $_tableName (peerId)
    ''');

    await db.execute('''
      CREATE INDEX idx_status ON $_tableName (status)
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Handle migrations here
  }

  void _ensureInitialized() {
    if (!_initialized || _database == null) {
      throw StateError('TransferHistoryService not initialized');
    }
  }

  /// Add a new transfer record
  Future<void> addTransfer(TransferRecord record) async {
    _ensureInitialized();

    await _database!.insert(
      _tableName,
      record.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    _logger.d('Transfer record added: ${record.id}');
  }

  /// Update a transfer record
  Future<void> updateTransfer(TransferRecord record) async {
    _ensureInitialized();

    await _database!.update(
      _tableName,
      record.toMap(),
      where: 'id = ?',
      whereArgs: [record.id],
    );
  }

  /// Update transfer progress
  Future<void> updateProgress(
    String id, {
    required double progress,
    required int bytesTransferred,
    double? averageSpeed,
  }) async {
    _ensureInitialized();

    await _database!.update(
      _tableName,
      {
        'progress': progress,
        'bytesTransferred': bytesTransferred,
        if (averageSpeed != null) 'averageSpeed': averageSpeed,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Mark transfer as completed
  Future<void> completeTransfer(
    String id, {
    String? filePath,
    String? checksum,
  }) async {
    _ensureInitialized();

    final endTime = DateTime.now();
    final record = await getTransfer(id);
    if (record == null) return;

    final duration = endTime.difference(record.startTime).inMilliseconds;
    final averageSpeed = record.fileSize / (duration / 1000);

    await _database!.update(
      _tableName,
      {
        'status': TransferStatus.completed.name,
        'progress': 1.0,
        'bytesTransferred': record.fileSize,
        'endTime': endTime.toIso8601String(),
        'duration': duration,
        'averageSpeed': averageSpeed,
        if (filePath != null) 'filePath': filePath,
        if (checksum != null) 'checksum': checksum,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
    _logger.d('Transfer completed: $id');
  }

  /// Mark transfer as failed
  Future<void> failTransfer(String id, String errorMessage) async {
    _ensureInitialized();

    await _database!.update(
      _tableName,
      {
        'status': TransferStatus.failed.name,
        'endTime': DateTime.now().toIso8601String(),
        'errorMessage': errorMessage,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
    _logger.d('Transfer failed: $id - $errorMessage');
  }

  /// Mark transfer as cancelled
  Future<void> cancelTransfer(String id) async {
    _ensureInitialized();

    await _database!.update(
      _tableName,
      {
        'status': TransferStatus.cancelled.name,
        'endTime': DateTime.now().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [id],
    );
    _logger.d('Transfer cancelled: $id');
  }

  /// Get a single transfer record
  Future<TransferRecord?> getTransfer(String id) async {
    _ensureInitialized();

    final results = await _database!.query(
      _tableName,
      where: 'id = ?',
      whereArgs: [id],
    );

    if (results.isEmpty) return null;
    return TransferRecord.fromMap(results.first);
  }

  /// Get all transfer records
  Future<List<TransferRecord>> getAllTransfers({
    int? limit,
    int? offset,
    TransferStatus? status,
    TransferDirection? direction,
    String? peerId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _ensureInitialized();

    String? where;
    List<dynamic>? whereArgs;

    final conditions = <String>[];
    final args = <dynamic>[];

    if (status != null) {
      conditions.add('status = ?');
      args.add(status.name);
    }

    if (direction != null) {
      conditions.add('direction = ?');
      args.add(direction.name);
    }

    if (peerId != null) {
      conditions.add('peerId = ?');
      args.add(peerId);
    }

    if (startDate != null) {
      conditions.add('startTime >= ?');
      args.add(startDate.toIso8601String());
    }

    if (endDate != null) {
      conditions.add('startTime <= ?');
      args.add(endDate.toIso8601String());
    }

    if (conditions.isNotEmpty) {
      where = conditions.join(' AND ');
      whereArgs = args;
    }

    final results = await _database!.query(
      _tableName,
      where: where,
      whereArgs: whereArgs,
      orderBy: 'startTime DESC',
      limit: limit,
      offset: offset,
    );

    return results.map((map) => TransferRecord.fromMap(map)).toList();
  }

  /// Get transfer statistics
  Future<TransferStatistics> getStatistics({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _ensureInitialized();

    String dateFilter = '';
    List<dynamic> args = [];

    if (startDate != null) {
      dateFilter += ' AND startTime >= ?';
      args.add(startDate.toIso8601String());
    }
    if (endDate != null) {
      dateFilter += ' AND startTime <= ?';
      args.add(endDate.toIso8601String());
    }

    final totalSent = await _database!.rawQuery('''
      SELECT COUNT(*) as count, COALESCE(SUM(fileSize), 0) as bytes
      FROM $_tableName
      WHERE direction = 'send' AND status = 'completed' $dateFilter
    ''', args);

    final totalReceived = await _database!.rawQuery('''
      SELECT COUNT(*) as count, COALESCE(SUM(fileSize), 0) as bytes
      FROM $_tableName
      WHERE direction = 'receive' AND status = 'completed' $dateFilter
    ''', args);

    final failed = await _database!.rawQuery('''
      SELECT COUNT(*) as count
      FROM $_tableName
      WHERE status = 'failed' $dateFilter
    ''', args);

    final avgSpeed = await _database!.rawQuery('''
      SELECT COALESCE(AVG(averageSpeed), 0) as speed
      FROM $_tableName
      WHERE status = 'completed' AND averageSpeed > 0 $dateFilter
    ''', args);

    return TransferStatistics(
      totalSent: (totalSent.first['count'] as int?) ?? 0,
      totalReceived: (totalReceived.first['count'] as int?) ?? 0,
      bytesSent: (totalSent.first['bytes'] as int?) ?? 0,
      bytesReceived: (totalReceived.first['bytes'] as int?) ?? 0,
      failedTransfers: (failed.first['count'] as int?) ?? 0,
      averageSpeed: (avgSpeed.first['speed'] as double?) ?? 0,
    );
  }

  /// Delete a transfer record
  Future<void> deleteTransfer(String id) async {
    _ensureInitialized();

    await _database!.delete(
      _tableName,
      where: 'id = ?',
      whereArgs: [id],
    );
    _logger.d('Transfer deleted: $id');
  }

  /// Delete multiple transfer records
  Future<void> deleteTransfers(List<String> ids) async {
    _ensureInitialized();

    await _database!.delete(
      _tableName,
      where: 'id IN (${ids.map((_) => '?').join(', ')})',
      whereArgs: ids,
    );
    _logger.d('Transfers deleted: ${ids.length}');
  }

  /// Clear all transfer history
  Future<void> clearHistory() async {
    _ensureInitialized();
    await _database!.delete(_tableName);
    _logger.w('All transfer history cleared');
  }

  /// Close the database
  Future<void> close() async {
    await _database?.close();
    _database = null;
    _initialized = false;
  }
}

/// Transfer record model
class TransferRecord {
  final String id;
  final String fileName;
  final int fileSize;
  final String? fileType;
  final String? filePath;
  final TransferDirection direction;
  final String peerId;
  final String peerName;
  final TransferStatus status;
  final double progress;
  final int bytesTransferred;
  final DateTime startTime;
  final DateTime? endTime;
  final int? duration;
  final double? averageSpeed;
  final String? errorMessage;
  final bool isEncrypted;
  final String? encryptionType;
  final String? checksum;
  final Map<String, dynamic>? metadata;

  TransferRecord({
    required this.id,
    required this.fileName,
    required this.fileSize,
    this.fileType,
    this.filePath,
    required this.direction,
    required this.peerId,
    required this.peerName,
    required this.status,
    this.progress = 0,
    this.bytesTransferred = 0,
    required this.startTime,
    this.endTime,
    this.duration,
    this.averageSpeed,
    this.errorMessage,
    this.isEncrypted = true,
    this.encryptionType,
    this.checksum,
    this.metadata,
  });

  TransferRecord copyWith({
    String? id,
    String? fileName,
    int? fileSize,
    String? fileType,
    String? filePath,
    TransferDirection? direction,
    String? peerId,
    String? peerName,
    TransferStatus? status,
    double? progress,
    int? bytesTransferred,
    DateTime? startTime,
    DateTime? endTime,
    int? duration,
    double? averageSpeed,
    String? errorMessage,
    bool? isEncrypted,
    String? encryptionType,
    String? checksum,
    Map<String, dynamic>? metadata,
  }) {
    return TransferRecord(
      id: id ?? this.id,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      fileType: fileType ?? this.fileType,
      filePath: filePath ?? this.filePath,
      direction: direction ?? this.direction,
      peerId: peerId ?? this.peerId,
      peerName: peerName ?? this.peerName,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      bytesTransferred: bytesTransferred ?? this.bytesTransferred,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      duration: duration ?? this.duration,
      averageSpeed: averageSpeed ?? this.averageSpeed,
      errorMessage: errorMessage ?? this.errorMessage,
      isEncrypted: isEncrypted ?? this.isEncrypted,
      encryptionType: encryptionType ?? this.encryptionType,
      checksum: checksum ?? this.checksum,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'fileName': fileName,
        'fileSize': fileSize,
        'fileType': fileType,
        'filePath': filePath,
        'direction': direction.name,
        'peerId': peerId,
        'peerName': peerName,
        'status': status.name,
        'progress': progress,
        'bytesTransferred': bytesTransferred,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime?.toIso8601String(),
        'duration': duration,
        'averageSpeed': averageSpeed,
        'errorMessage': errorMessage,
        'isEncrypted': isEncrypted ? 1 : 0,
        'encryptionType': encryptionType,
        'checksum': checksum,
        'metadata': metadata != null ? jsonEncode(metadata) : null,
      };

  factory TransferRecord.fromMap(Map<String, dynamic> map) {
    return TransferRecord(
      id: map['id'] as String,
      fileName: map['fileName'] as String,
      fileSize: map['fileSize'] as int,
      fileType: map['fileType'] as String?,
      filePath: map['filePath'] as String?,
      direction: TransferDirection.values.firstWhere(
        (d) => d.name == map['direction'],
      ),
      peerId: map['peerId'] as String,
      peerName: map['peerName'] as String,
      status: TransferStatus.values.firstWhere(
        (s) => s.name == map['status'],
      ),
      progress: (map['progress'] as num?)?.toDouble() ?? 0,
      bytesTransferred: map['bytesTransferred'] as int? ?? 0,
      startTime: DateTime.parse(map['startTime'] as String),
      endTime: map['endTime'] != null
          ? DateTime.parse(map['endTime'] as String)
          : null,
      duration: map['duration'] as int?,
      averageSpeed: (map['averageSpeed'] as num?)?.toDouble(),
      errorMessage: map['errorMessage'] as String?,
      isEncrypted: (map['isEncrypted'] as int?) == 1,
      encryptionType: map['encryptionType'] as String?,
      checksum: map['checksum'] as String?,
      metadata: map['metadata'] != null
          ? jsonDecode(map['metadata'] as String) as Map<String, dynamic>
          : null,
    );
  }
}

/// Transfer direction
enum TransferDirection {
  send,
  receive,
}

/// Transfer status
enum TransferStatus {
  pending,
  connecting,
  transferring,
  paused,
  completed,
  failed,
  cancelled,
}

/// Transfer statistics
class TransferStatistics {
  final int totalSent;
  final int totalReceived;
  final int bytesSent;
  final int bytesReceived;
  final int failedTransfers;
  final double averageSpeed;

  TransferStatistics({
    required this.totalSent,
    required this.totalReceived,
    required this.bytesSent,
    required this.bytesReceived,
    required this.failedTransfers,
    required this.averageSpeed,
  });

  int get totalTransfers => totalSent + totalReceived;
  int get totalBytes => bytesSent + bytesReceived;
}
