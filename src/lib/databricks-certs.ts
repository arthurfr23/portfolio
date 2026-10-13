import dataset from '../data/databricks-certs-br.json';
import type { Person } from '../components/islands/CertDashboard';

export const people = dataset.people as Person[];
export const snapshot = dataset.snapshot;

export function summary() {
  const total = people.length;
  const certs = people.reduce((s, p) => s + p.c, 0);
  const companies = new Set(people.map((p) => p.w).filter(Boolean)).size;
  return { total, certs, companies };
}
