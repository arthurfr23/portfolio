import { XMLParser } from 'fast-xml-parser';
import { readCache, writeCache } from './cache';

const DEFAULT_TIMEOUT = 10_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Executa o fetcher; em sucesso atualiza o cache, em falha cai no último
 * snapshot. Garante que o build nunca quebra por causa de um feed externo.
 */
export async function resilient<T>(
  key: string,
  fallback: T,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const data = await fetcher();
    await writeCache(key, data);
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[build] feed "${key}" indisponível — usando cache. (${msg})`);
    return readCache<T>(key, fallback);
  }
}

export function makeParser(): XMLParser {
  return new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
}

export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
