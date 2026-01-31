/**
 * React Hook for CLI-Web Bridge
 *
 * Enables React components to send/receive files with Tallow CLI
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CLIRelayClient,
  RoomCode,
  MessageType,
  FileInfoCodec,
  ChunkCodec,
  generateRoomCode,
  type FileInfo,
} from './cli-protocol';

export interface CLIBridgeState {
  isConnected: boolean;
  isWaiting: boolean;
  isTransferring: boolean;
  progress: number;
  speed: number; // bytes per second
  error: string | null;
  roomCode: string | null;
  peerType: 'cli' | 'web' | null;
}

export interface CLIBridgeActions {
  // Send file to CLI receiver
  sendToCLI: (file: File, customCode?: string) => Promise<string>;
  // Receive file from CLI sender
  receiveFromCLI: (code: string, onFile: (file: File) => void) => Promise<void>;
  // Cancel current transfer
  cancel: () => void;
  // Generate a new room code
  generateCode: (numWords?: number) => string;
}

const DEFAULT_RELAY = 'wss://relay.tallow.io';
const CHUNK_SIZE = 65536;

export function useCLIBridge(relayUrl: string = DEFAULT_RELAY): [CLIBridgeState, CLIBridgeActions] {
  const [state, setState] = useState<CLIBridgeState>({
    isConnected: false,
    isWaiting: false,
    isTransferring: false,
    progress: 0,
    speed: 0,
    error: null,
    roomCode: null,
    peerType: null,
  });

  const clientRef = useRef<CLIRelayClient | null>(null);
  const transferStartRef = useRef<number>(0);
  const bytesTransferredRef = useRef<number>(0);
  const cancelledRef = useRef<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.close();
    };
  }, []);

  const updateState = useCallback((updates: Partial<CLIBridgeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const calculateSpeed = useCallback(() => {
    const elapsed = (Date.now() - transferStartRef.current) / 1000;
    if (elapsed > 0) {
      return bytesTransferredRef.current / elapsed;
    }
    return 0;
  }, []);

  /**
   * Send a file that CLI can receive
   */
  const sendToCLI = useCallback(async (file: File, customCode?: string): Promise<string> => {
    cancelledRef.current = false;

    const code = customCode || generateRoomCode(3);
    updateState({
      roomCode: code,
      isWaiting: true,
      error: null,
      progress: 0,
    });

    const client = new CLIRelayClient(relayUrl);
    clientRef.current = client;

    try {
      // Connect to relay
      await client.connect(code);
      updateState({ isConnected: true });

      // Wait for peer (handled by relay text messages)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 300000);

        client.setHandlers({
          onMessage: (type, _payload) => {
            // CLI connected and sent PAKE message
            if (type === MessageType.PAKE_MSG1) {
              clearTimeout(timeout);
              updateState({ isWaiting: false, peerType: 'cli' });
              resolve();
            }
          },
          onError: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
        });
      });

      if (cancelledRef.current) {
        throw new Error('Cancelled');
      }

      // Start transfer
      updateState({ isTransferring: true });
      transferStartRef.current = Date.now();
      bytesTransferredRef.current = 0;

      // Calculate file info
      const fileData = new Uint8Array(await file.arrayBuffer());
      const { sha256 } = await import('@noble/hashes/sha2.js');
      const checksum = sha256(fileData);
      const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);

      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        compressed: false,
        compressedSize: file.size,
        checksum,
        totalChunks,
        chunkSize: CHUNK_SIZE,
      };

      // Send file info
      client.send(MessageType.FILE_INFO, FileInfoCodec.encode(fileInfo));

      // Send chunks
      for (let i = 0; i < totalChunks; i++) {
        if (cancelledRef.current) {
          throw new Error('Cancelled');
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileData.length);
        const chunk = fileData.slice(start, end);
        const chunkChecksum = ChunkCodec.computeChecksum(chunk);

        const header = ChunkCodec.encodeHeader({
          index: i,
          size: chunk.length,
          checksum: chunkChecksum,
        });

        // Combine header and data
        const message = new Uint8Array(header.length + chunk.length);
        message.set(header);
        message.set(chunk, header.length);

        client.send(MessageType.CHUNK, message);

        bytesTransferredRef.current = end;
        updateState({
          progress: (i + 1) / totalChunks * 100,
          speed: calculateSpeed(),
        });

        // Small delay to prevent overwhelming
        if (i % 10 === 0) {
          await new Promise(r => setTimeout(r, 1));
        }
      }

      // Send done
      client.send(MessageType.DONE, new Uint8Array(0));

      updateState({
        isTransferring: false,
        progress: 100,
      });

      return code;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      updateState({ error: message, isTransferring: false, isWaiting: false });
      throw error;
    } finally {
      client.close();
      clientRef.current = null;
    }
  }, [relayUrl, updateState, calculateSpeed]);

  /**
   * Receive a file from CLI sender
   */
  const receiveFromCLI = useCallback(async (
    code: string,
    onFile: (file: File) => void
  ): Promise<void> => {
    cancelledRef.current = false;

    if (!RoomCode.validate(code)) {
      throw new Error('Invalid room code format');
    }

    updateState({
      roomCode: code,
      isWaiting: true,
      error: null,
      progress: 0,
    });

    const client = new CLIRelayClient(relayUrl);
    clientRef.current = client;

    try {
      await client.connect(code);
      updateState({ isConnected: true });

      let fileInfo: FileInfo | null = null;
      const chunks: Map<number, Uint8Array> = new Map();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Transfer timeout')), 600000);

        client.setHandlers({
          onMessage: (type, payload) => {
            if (cancelledRef.current) {
              clearTimeout(timeout);
              reject(new Error('Cancelled'));
              return;
            }

            switch (type) {
              case MessageType.FILE_INFO:
                fileInfo = FileInfoCodec.decode(payload);
                if (!fileInfo) {
                  reject(new Error('Invalid file info'));
                  return;
                }
                updateState({
                  isWaiting: false,
                  isTransferring: true,
                  peerType: 'cli',
                });
                transferStartRef.current = Date.now();
                bytesTransferredRef.current = 0;
                break;

              case MessageType.CHUNK:
                if (!fileInfo) {
                  reject(new Error('Received chunk before file info'));
                  return;
                }

                const header = ChunkCodec.decodeHeader(payload);
                if (!header) {
                  reject(new Error('Invalid chunk header'));
                  return;
                }

                const chunkData = payload.slice(16);

                // Verify checksum
                if (!ChunkCodec.verifyChecksum(chunkData, header.checksum)) {
                  reject(new Error(`Chunk ${header.index} checksum mismatch`));
                  return;
                }

                chunks.set(header.index, chunkData);
                bytesTransferredRef.current += chunkData.length;

                updateState({
                  progress: chunks.size / fileInfo.totalChunks * 100,
                  speed: calculateSpeed(),
                });
                break;

              case MessageType.DONE:
                clearTimeout(timeout);

                if (!fileInfo) {
                  reject(new Error('No file info received'));
                  return;
                }

                // Assemble file
                const totalSize = fileInfo.size;
                const assembled = new Uint8Array(totalSize);
                let offset = 0;

                for (let i = 0; i < fileInfo.totalChunks; i++) {
                  const chunk = chunks.get(i);
                  if (!chunk) {
                    reject(new Error(`Missing chunk ${i}`));
                    return;
                  }
                  assembled.set(chunk, offset);
                  offset += chunk.length;
                }

                // Create File object
                const file = new File([assembled], fileInfo.name, {
                  type: 'application/octet-stream',
                });

                updateState({
                  isTransferring: false,
                  progress: 100,
                });

                onFile(file);
                resolve();
                break;

              case MessageType.ERROR:
                clearTimeout(timeout);
                const errorMsg = new TextDecoder().decode(payload);
                reject(new Error(errorMsg || 'Transfer error'));
                break;
            }
          },
          onError: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
          onDisconnect: () => {
            if (!cancelledRef.current) {
              clearTimeout(timeout);
              reject(new Error('Connection lost'));
            }
          },
        });
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      updateState({ error: message, isTransferring: false, isWaiting: false });
      throw error;
    } finally {
      client.close();
      clientRef.current = null;
    }
  }, [relayUrl, updateState, calculateSpeed]);

  /**
   * Cancel current transfer
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    clientRef.current?.close();
    clientRef.current = null;

    updateState({
      isConnected: false,
      isWaiting: false,
      isTransferring: false,
      error: 'Cancelled',
    });
  }, [updateState]);

  /**
   * Generate a new room code
   */
  const generateCode = useCallback((numWords: number = 3): string => {
    return generateRoomCode(numWords);
  }, []);

  const actions: CLIBridgeActions = {
    sendToCLI,
    receiveFromCLI,
    cancel,
    generateCode,
  };

  return [state, actions];
}

export default useCLIBridge;
