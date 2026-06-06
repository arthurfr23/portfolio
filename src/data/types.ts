import type { Locale } from '../config/site';

export type I18nString = Record<Locale, string>;
export type I18nArray = Record<Locale, string[]>;

export interface Profile {
  name: string;
  headline: I18nString;
  tagline: I18nString;
  bio: I18nString;
  location: I18nString;
  /** caminho em /public (aplicar withBase no componente) */
  photo: string;
  email: string;
  cvPdf: Record<Locale, string>;
  siteTitle: I18nString;
  metaDescription: I18nString;
}

export type SkillLevel = 'core' | 'proficient' | 'familiar';
export type Accent = 'blue' | 'cyan' | 'emerald';

export interface SkillCategory {
  id: string;
  label: I18nString;
  accent: Accent;
  skills: { name: string; level?: SkillLevel }[];
}

export interface ExperienceItem {
  company: string;
  role: I18nString;
  /** 'YYYY-MM' */
  startDate: string;
  /** 'YYYY-MM' ou null para o cargo atual */
  endDate: string | null;
  location: I18nString;
  summary: I18nString;
  highlights: I18nArray;
  stack: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  /** 'YYYY-MM' */
  date?: string;
  credentialUrl?: string;
  /** caminho em /public (aplicar withBase) */
  badgeImage?: string;
  status: 'completed' | 'in-progress';
}

export interface Talk {
  title: I18nString;
  event: string;
  /** 'YYYY-MM-DD' */
  date: string;
  location: I18nString;
  description?: I18nString;
  url?: string;
  slidesUrl?: string;
}

export interface Channels {
  github: { username: string };
  youtube: { channelId: string; url: string };
  medium: { username: string; url: string };
  linkedin: { url: string };
}

export interface CuratedProject {
  /** nome do repositório, casa com a API do GitHub */
  repo: string;
  featured: boolean;
  /** sobrescreve/traduz a descrição vinda do GitHub */
  description?: I18nString;
  tags?: string[];
}
