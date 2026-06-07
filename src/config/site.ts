// Fonte única da verdade para URL/base/idiomas/flags.
// Trocar aqui para custom domain: SITE = 'https://seudominio.com', BASE = '/'
// e criar public/CNAME com o domínio.

export const SITE = 'https://arthurfr23.github.io';
export const BASE = '/site_pessoal';

export const LOCALES = ['pt', 'en'] as const;
export const DEFAULT_LOCALE = 'pt';

export type Locale = (typeof LOCALES)[number];

// Hooks de features (ligados em fases futuras)
export const FEATURES = {
  themeToggle: false, // light mode — Fase 4
  analytics: false, // Fase 4
} as const;

// Contrato de analytics — preenchido na Fase 4 (Umami/Plausible)
export const ANALYTICS = {
  provider: null as 'umami' | 'plausible' | null,
  scriptSrc: '',
  websiteId: '',
};

// Newsletter (Buttondown). Crie uma conta grátis em buttondown.com e cole o
// handle aqui. Enquanto vazio, a seção de newsletter não é renderizada.
export const NEWSLETTER = {
  buttondownHandle: '', // TODO: ex. 'arthur-reis'
};
