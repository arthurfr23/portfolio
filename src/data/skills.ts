import type { SkillCategory } from './types';

export const skillCategories: SkillCategory[] = [
  {
    id: 'platforms',
    label: { pt: 'Plataformas de Dados', en: 'Data Platforms' },
    accent: 'blue',
    skills: [
      { name: 'Microsoft Fabric', level: 'core' },
      { name: 'Databricks', level: 'core' },
      { name: 'Azure Synapse', level: 'proficient' },
      { name: 'OneLake', level: 'proficient' },
      { name: 'Snowflake', level: 'familiar' },
    ],
  },
  {
    id: 'processing',
    label: { pt: 'Processamento & Big Data', en: 'Processing & Big Data' },
    accent: 'cyan',
    skills: [
      { name: 'Apache Spark', level: 'core' },
      { name: 'PySpark', level: 'core' },
      { name: 'Delta Lake', level: 'core' },
      { name: 'Structured Streaming', level: 'proficient' },
    ],
  },
  {
    id: 'languages',
    label: { pt: 'Linguagens & Query', en: 'Languages & Query' },
    accent: 'emerald',
    skills: [
      { name: 'Python', level: 'core' },
      { name: 'SQL', level: 'core' },
      { name: 'Spark SQL', level: 'proficient' },
      { name: 'DAX', level: 'familiar' },
    ],
  },
  {
    id: 'orchestration',
    label: { pt: 'Orquestração & CI/CD', en: 'Orchestration & CI/CD' },
    accent: 'blue',
    skills: [
      { name: 'Databricks Asset Bundles', level: 'proficient' },
      { name: 'Azure DevOps', level: 'proficient' },
      { name: 'GitHub Actions', level: 'proficient' },
      { name: 'dbt', level: 'proficient' },
      { name: 'Apache Airflow', level: 'familiar' },
    ],
  },
  {
    id: 'quality',
    label: { pt: 'Qualidade & Governança', en: 'Quality & Governance' },
    accent: 'cyan',
    skills: [
      { name: 'Unity Catalog', level: 'core' },
      { name: 'DQX', level: 'proficient' },
      { name: 'Great Expectations', level: 'proficient' },
      { name: 'Data Contracts', level: 'proficient' },
    ],
  },
  {
    id: 'ai',
    label: { pt: 'IA & Agentes', en: 'AI & Agents' },
    accent: 'emerald',
    skills: [
      { name: 'Multi-agent Systems', level: 'proficient' },
      { name: 'RAG', level: 'proficient' },
      { name: 'Prompt Engineering', level: 'proficient' },
      { name: 'Mosaic AI', level: 'familiar' },
      { name: 'MCP', level: 'familiar' },
    ],
  },
];
