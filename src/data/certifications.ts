import type { Certification } from './types';

// ⚠️ CONFIRMAR — ajustar status, datas e URLs de verificação reais.
export const certifications: Certification[] = [
  {
    name: 'AZ-900: Azure Fundamentals',
    issuer: 'Microsoft',
    status: 'completed',
    credentialUrl: '', // TODO: link de verificação
  },
  {
    name: 'DP-700: Fabric Data Engineer',
    issuer: 'Microsoft',
    status: 'in-progress',
  },
  {
    name: 'Databricks Certified Data Engineer Associate',
    issuer: 'Databricks',
    status: 'in-progress',
  },
  {
    name: 'Microsoft Student Ambassador',
    issuer: 'Microsoft',
    status: 'completed',
  },
];
