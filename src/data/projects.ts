import type { CuratedProject } from './types';

// Projetos curados. `repo` casa com o nome real no GitHub; estrelas, linguagem e
// data vêm da API no build. `description` aqui sobrescreve/traduz a do GitHub.
// A ordem deste array define a ordem de exibição (destaques primeiro).
export const curatedProjects: CuratedProject[] = [
  {
    repo: 'dqx_framework',
    featured: true,
    description: {
      pt: 'Framework de qualidade de dados com Databricks DQX.',
      en: 'Data quality framework built on Databricks DQX.',
    },
    tags: ['Databricks', 'Data Quality', 'PySpark'],
  },
  {
    repo: 'fabric-documenter',
    featured: true,
    description: {
      pt: 'Documentação automática de notebooks e medidas DAX do Microsoft Fabric via API.',
      en: 'Automatic documentation of Microsoft Fabric notebooks and DAX measures via API.',
    },
    tags: ['Fabric', 'Python', 'Power BI'],
  },
  {
    repo: 'sql_saturday_joinvile_2026_dq',
    featured: true,
    description: {
      pt: 'Materiais e código da palestra de Qualidade de Dados no SQL Saturday Joinville 2026.',
      en: 'Materials and code from the Data Quality talk at SQL Saturday Joinville 2026.',
    },
    tags: ['Data Quality', 'Databricks', 'Talk'],
  },
  {
    repo: 'great_expectations_framework',
    featured: true,
    description: {
      pt: 'Validação de dados e contratos com Great Expectations.',
      en: 'Data validation and contracts with Great Expectations.',
    },
    tags: ['Python', 'Data Quality'],
  },
  {
    repo: 'auto_comments_columns_databricks',
    featured: false,
    description: {
      pt: 'Geração automática de descrições de colunas de tabelas no Databricks.',
      en: 'Automatic generation of table column descriptions in Databricks.',
    },
    tags: ['Databricks', 'Python', 'Automation'],
  },
  {
    repo: 'snowflake_cortex',
    featured: false,
    description: {
      pt: 'Exploração de GenAI e análise de dados com Snowflake Cortex.',
      en: 'Exploring GenAI and data analytics with Snowflake Cortex.',
    },
    tags: ['Snowflake', 'GenAI'],
  },
  {
    repo: 'validation_notebook',
    featured: false,
    description: {
      pt: 'Notebooks de validação e checagem de dados em Python.',
      en: 'Python notebooks for data validation and checks.',
    },
    tags: ['Python', 'Data Quality'],
  },
  {
    repo: 'transfermarkt_scraping',
    featured: false,
    description: {
      pt: 'Web scraping do Transfermarkt com classificação via DeepFace.',
      en: 'Transfermarkt web scraping with DeepFace classification.',
    },
    tags: ['Python', 'Web Scraping'],
  },
];
