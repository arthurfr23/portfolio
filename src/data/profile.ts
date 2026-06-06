import type { Profile } from './types';

// ⚠️ Conteúdo inicial derivado do contexto. Revisar/ajustar bio, localização e e-mail.
export const profile: Profile = {
  name: 'Arthur Reis',
  headline: {
    pt: 'Engenheiro de Dados Sênior',
    en: 'Senior Data Engineer',
  },
  tagline: {
    pt: 'Microsoft Fabric · Databricks · Azure',
    en: 'Microsoft Fabric · Databricks · Azure',
  },
  bio: {
    pt: 'Engenheiro de Dados Sênior especializado em Microsoft Fabric, Databricks e Azure. Construo plataformas de dados modernas — arquiteturas lakehouse, pipelines de alta performance e frameworks de qualidade de dados — e exploro IA aplicada com sistemas multi-agente. Compartilho o que aprendo em palestras, no LinkedIn e em projetos open source.',
    en: 'Senior Data Engineer specialized in Microsoft Fabric, Databricks and Azure. I build modern data platforms — lakehouse architectures, high-performance pipelines and data quality frameworks — and explore applied AI with multi-agent systems. I share what I learn through talks, LinkedIn and open source projects.',
  },
  location: {
    pt: 'Brasil',
    en: 'Brazil',
  },
  photo: '/images/profile.jpg', // ⚠️ adicionar arquivo em public/images/profile.jpg
  email: 'arthurfr23@gmail.com',
  cvPdf: {
    pt: '/cv/arthur-reis-cv-pt.pdf', // ⚠️ adicionar PDF
    en: '/cv/arthur-reis-cv-en.pdf', // ⚠️ adicionar PDF
  },
  siteTitle: {
    pt: 'Arthur Reis · Engenheiro de Dados',
    en: 'Arthur Reis · Data Engineer',
  },
  metaDescription: {
    pt: 'Portfólio de Arthur Reis, Engenheiro de Dados Sênior — Microsoft Fabric, Databricks, Azure, qualidade de dados e IA aplicada.',
    en: 'Portfolio of Arthur Reis, Senior Data Engineer — Microsoft Fabric, Databricks, Azure, data quality and applied AI.',
  },
};
