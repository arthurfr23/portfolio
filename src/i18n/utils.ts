import { DEFAULT_LOCALE, LOCALES, type Locale } from '../config/site';
import { ui, type UIKey } from './ui';

const LOCALE_SET: readonly string[] = LOCALES;

/** Extrai o locale a partir da URL (já considerando o BASE_URL do Astro). */
export function getLangFromUrl(url: URL): Locale {
  const stripped = url.pathname.replace(import.meta.env.BASE_URL, '/');
  const seg = stripped.split('/').filter(Boolean)[0];
  return LOCALE_SET.includes(seg) ? (seg as Locale) : DEFAULT_LOCALE;
}

/** Tradutor de strings de UI com fallback para o idioma padrão. */
export function useTranslations(lang: Locale) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[DEFAULT_LOCALE][key] ?? key;
  };
}

/** Prefixa o BASE_URL a um caminho de asset/arquivo em /public. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}

/** Resolve um campo bilíngue para o idioma atual, com fallback. */
export function tr<T>(field: Record<Locale, T>, lang: Locale): T {
  return field[lang] ?? field[DEFAULT_LOCALE];
}

const bcp47 = (lang: Locale) => (lang === 'pt' ? 'pt-BR' : 'en-US');

/** 'YYYY-MM' -> 'jan 2023' / 'Jan 2023' */
export function formatMonthYear(ym: string, lang: Locale): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString(bcp47(lang), { month: 'short', year: 'numeric' });
}

/** 'YYYY-MM-DD' -> data por extenso */
export function formatFullDate(ymd: string, lang: Locale): string {
  const d = new Date(`${ymd}T00:00:00`);
  return d.toLocaleDateString(bcp47(lang), { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Qualquer data parseável (ISO/RFC822) -> 'dd mmm yyyy' */
export function formatDateShort(input: string, lang: Locale): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(bcp47(lang), { day: '2-digit', month: 'short', year: 'numeric' });
}
