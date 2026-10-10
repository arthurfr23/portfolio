import dataset from '../data/databricks-certs-br.json';
import type { Person } from '../components/islands/CertDashboard';
import type { Locale } from '../config/site';

export const people = dataset.people as Person[];

export function snapshotLabel(lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dataset.snapshot}T00:00:00Z`));
}

export function summary() {
  const total = people.length;
  const certs = people.reduce((s, p) => s + p.c, 0);
  const companies = new Set(people.map((p) => p.w).filter(Boolean)).size;
  const me = people.find((p) => p.me);
  const atLeastMe = me ? people.filter((p) => p.c >= me.c).length : 0;
  return {
    total,
    certs,
    companies,
    me: me
      ? { rank: me.r, certs: me.c, peers: atLeastMe, topPct: Math.ceil((atLeastMe / total) * 100) }
      : null,
  };
}
