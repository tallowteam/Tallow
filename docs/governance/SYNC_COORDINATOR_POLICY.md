# Sync Coordinator Policy (AGENT 029)

## Objective
Every file transfer MUST be resumable from its last successful chunk. Transfer state MUST persist to survive browser refresh. Delta sync MUST reduce re-transfer of modified files by 90%+ when applicable.

## Transfer State Machine
```
IDLE -> NEGOTIATING -> TRANSFERRING -> PAUSED -> RESUMING -> COMPLETED
                                    -> FAILED -> RETRYING
```

All states and transitions are defined in `lib/transfer/state-machine.ts`. The machine supports serialization (`serialize()`) and deserialization (`TransferStateMachine.deserialize()`) for persistence across browser sessions.

## Required Controls

### 1. Resumable Transfers
- Every active transfer MUST track chunk completion via a bitmap (bit-per-chunk).
- On disconnection, in-flight transfer state MUST be persisted to IndexedDB before cleanup.
- On reconnect, peers MUST exchange chunk bitmaps and only retransmit missing chunks.
- The `ResumablePQCTransferManager` in `lib/transfer/resumable-transfer.ts` implements this protocol.

### 2. State Persistence
- Transfer metadata (file name, size, hash, chunk bitmap, session keys) MUST be persisted in `TallowTransferStateDB` (IndexedDB).
- The persistence layer is `lib/storage/transfer-state-db.ts`.
- Expired transfers (>7 days) are automatically cleaned up.
- Chunk data MUST be stored alongside metadata so that partial downloads survive refresh.

### 3. Delta Sync
- For repeated transfers of the same file, only changed blocks MUST be sent.
- `lib/transfer/delta-sync.ts` implements block-level SHA-256 signatures and delta computation.
- `lib/transfer/delta-sync-manager.ts` provides session management and LRU signature caching.
- Optimal block size MUST be calculated based on file size via `calculateOptimalBlockSize()`.
- Bandwidth savings MUST be estimated and reported via `estimateSavings()`.

### 4. Store Actions Constraint
- All Zustand store mutations during transfer MUST go through `lib/transfer/store-actions.ts`.
- This module is plain TypeScript (no React hooks) to prevent React Compiler/Turbopack from transforming `.getState()` into reactive subscriptions.

### 5. Release Gate
- `npm run verify:sync:coordinator` MUST pass in CI and release verification workflows.
- The test file `tests/unit/transfer/sync-coordinator.test.ts` MUST exist and cover:
  - State machine transitions (full lifecycle)
  - Chunk bitmap tracking and resume-from-last-chunk
  - Delta sync savings >= 90% for minor modifications
  - State persistence serialization round-trip

## Evidence Anchors
- `lib/transfer/state-machine.ts`
- `lib/transfer/resumable-transfer.ts`
- `lib/transfer/delta-sync.ts`
- `lib/transfer/delta-sync-manager.ts`
- `lib/transfer/store-actions.ts`
- `lib/storage/transfer-state-db.ts`
- `tests/unit/transfer/sync-coordinator.test.ts`
- `scripts/verify-sync-coordinator.js`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
