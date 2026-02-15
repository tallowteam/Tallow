/**
 * WASM Compression Bridge
 *
 * Provides an async WASM-first entry point for compression with deterministic
 * JavaScript fallback. The WASM module is optional and loaded on demand.
 */

import { gzipSync, gunzipSync, zlibSync, unzlibSync } from 'fflate';
import { isWasmSupported, loadWasmModule } from './wasm-loader';

export type WasmCompressionAlgorithm = 'gzip' | 'deflate';

type CompressionExports = {
  compress?: (algorithm: number, data: Uint8Array) => Uint8Array;
  decompress?: (algorithm: number, data: Uint8Array) => Uint8Array;
};

function getAlgorithmId(algorithm: WasmCompressionAlgorithm): number {
  return algorithm === 'deflate' ? 1 : 0;
}

function compressJS(data: Uint8Array, algorithm: WasmCompressionAlgorithm): Uint8Array {
  if (algorithm === 'deflate') {
    return zlibSync(data);
  }
  return gzipSync(data);
}

function decompressJS(data: Uint8Array, algorithm: WasmCompressionAlgorithm): Uint8Array {
  if (algorithm === 'deflate') {
    return unzlibSync(data);
  }
  return gunzipSync(data);
}

async function getCompressionExports(): Promise<CompressionExports | null> {
  if (!isWasmSupported()) {
    return null;
  }

  try {
    const instance = await loadWasmModule('compression');
    return instance.exports as CompressionExports;
  } catch {
    return null;
  }
}

export async function compressWithWasm(
  data: Uint8Array,
  algorithm: WasmCompressionAlgorithm = 'gzip'
): Promise<Uint8Array> {
  const exports = await getCompressionExports();
  const algorithmId = getAlgorithmId(algorithm);

  if (exports?.compress) {
    try {
      return exports.compress(algorithmId, data);
    } catch {
      return compressJS(data, algorithm);
    }
  }

  return compressJS(data, algorithm);
}

export async function decompressWithWasm(
  data: Uint8Array,
  algorithm: WasmCompressionAlgorithm = 'gzip'
): Promise<Uint8Array> {
  const exports = await getCompressionExports();
  const algorithmId = getAlgorithmId(algorithm);

  if (exports?.decompress) {
    try {
      return exports.decompress(algorithmId, data);
    } catch {
      return decompressJS(data, algorithm);
    }
  }

  return decompressJS(data, algorithm);
}
