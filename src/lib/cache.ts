import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const CACHE_DIR = join(process.cwd(), '.cache');

/** Lê o snapshot de fallback de um feed (.cache/<key>.json). */
export async function readCache<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(join(CACHE_DIR, `${key}.json`), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Persiste o último snapshot bem-sucedido (ignora erro em FS read-only). */
export async function writeCache(key: string, data: unknown): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(join(CACHE_DIR, `${key}.json`), JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    /* no-op */
  }
}
