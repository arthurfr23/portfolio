import type { ExperienceItem } from './types';

// ⚠️ PLACEHOLDER — substituir por datas, cargos e conquistas reais.
// As datas abaixo são exemplos para montar a timeline; ajuste antes de publicar.
export const experience: ExperienceItem[] = [
  {
    company: 'PowerTunning',
    role: { pt: 'Engenheiro de Dados Sênior', en: 'Senior Data Engineer' },
    startDate: '2023-01',
    endDate: null,
    location: { pt: 'Brasil · Remoto', en: 'Brazil · Remote' },
    summary: {
      pt: 'Arquitetura e implementação de plataformas de dados modernas em Databricks e Microsoft Fabric.',
      en: 'Architecting and implementing modern data platforms on Databricks and Microsoft Fabric.',
    },
    highlights: {
      pt: [
        'Design de arquiteturas lakehouse (medallion) com Delta Lake e Unity Catalog.',
        'Frameworks de qualidade de dados com DQX e Great Expectations.',
        'CI/CD de dados com Databricks Asset Bundles, Azure DevOps e GitHub Actions.',
        'Exploração de IA aplicada com sistemas multi-agente para engenharia de dados.',
      ],
      en: [
        'Designed lakehouse (medallion) architectures with Delta Lake and Unity Catalog.',
        'Built data quality frameworks with DQX and Great Expectations.',
        'Implemented data CI/CD with Databricks Asset Bundles, Azure DevOps and GitHub Actions.',
        'Explored applied AI with multi-agent systems for data engineering.',
      ],
    },
    stack: ['Databricks', 'Microsoft Fabric', 'Azure', 'Spark', 'Python', 'SQL'],
  },
];
