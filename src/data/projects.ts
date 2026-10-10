import type { CuratedProject } from './types';

export const curatedProjects: CuratedProject[] = [
  {
    repo: 'dqx_forge',
    featured: true,
    description: {
      pt: 'Extensão do VS Code para montar um framework de qualidade de dados no Lakehouse Databricks com DQX — profiling, contratos versionados, dry runs, jobs agendados e dashboard de qualidade.',
      en: 'VS Code extension to build a Databricks Lakehouse data quality framework with DQX — profiling, versioned contracts, dry runs, scheduled jobs and a quality dashboard.',
    },
    tags: ['Databricks', 'DQX', 'Data Quality', 'VS Code'],
  },
  {
    repo: 'data-agents-copilot',
    featured: true,
    staticUrl: 'https://github.com/arthurfr23/data-agents-copilot',
    description: {
      pt: 'Sistema multi-agente para engenharia de dados com 15 agentes especializados, memória episódica e servidores MCP.',
      en: 'Multi-agent system for data engineering with 15 specialist agents, episodic memory and MCP servers.',
    },
    tags: ['Python', 'Multi-agent', 'LLM', 'MCP'],
  },
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
];
