/**
 * WASM Chunking Bridge
 *
 * Exposes async chunking operations with optional WASM acceleration and
 * deterministic JavaScript fallback for browsers without WASM modules.
 */

import { isWasmSupported, loadWasmModule } from './wasm-loader';

type ChunkingExports = {
  chunk?: (data: Uint8Array, chunkSize: number) => Uint8Array[];
};

function chunkJS(data: Uint8Array, chunkSize: number): Uint8Array[] {
  const safeChunkSize = Math.max(1, chunkSize);
  const chunks: Uint8Array[] = [];

  for (let offset = 0; offset < data.length; offset += safeChunkSize) {
    chunks.push(data.slice(offset, offset + safeChunkSize));
  }

  return chunks;
}

async function getChunkingExports(): Promise<ChunkingExports | null> {
  if (!isWasmSupported()) {
    return null;
  }

  try {
    const instance = await loadWasmModule('chunking');
    return instance.exports as ChunkingExports;
  } catch {
    return null;
  }
}

export async function chunkBufferWithWasm(
  data: Uint8Array,
  chunkSize: number
): Promise<Uint8Array[]> {
  const exports = await getChunkingExports();

  if (exports?.chunk) {
    try {
      return exports.chunk(data, chunkSize);
    } catch {
      return chunkJS(data, chunkSize);
    }
  }

  return chunkJS(data, chunkSize);
}

export function reassembleChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}
