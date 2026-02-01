/**
 * CLI Bridge Module
 *
 * Enables seamless file transfers between Tallow Web App and Tallow CLI.
 *
 * @example
 * ```tsx
 * import { useCLIBridge, RoomCode, generateRoomCode } from '@/lib/cli-bridge';
 *
 * function MyComponent() {
 *   const [state, actions] = useCLIBridge();
 *
 *   // Send file to CLI receiver
 *   const handleSend = async (file: File) => {
 *     const code = await actions.sendToCLI(file);
 *     console.log(`Tell CLI user to run: tallow receive ${code}`);
 *   };
 *
 *   // Receive file from CLI sender
 *   const handleReceive = async (code: string) => {
 *     await actions.receiveFromCLI(code, (file) => {
 *       console.log(`Received: ${file.name}`);
 *     });
 *   };
 * }
 * ```
 */

// Protocol types and utilities
export {
  RoomCode,
  MessageCodec,
  FileInfoCodec,
  ChunkCodec,
  CLIRelayClient,
  generateRoomCode,
  MessageType,
  ErrorCode,
  PROTOCOL_VERSION,
  CHUNK_SIZE,
  type FileInfo,
  type ChunkHeader,
} from './cli-protocol';

// React hook
export {
  useCLIBridge,
  type CLIBridgeState,
  type CLIBridgeActions,
} from './use-cli-bridge';

// Default export
export { default as CLIProtocol } from './cli-protocol';
export { default as useCLIBridgeHook } from './use-cli-bridge';
