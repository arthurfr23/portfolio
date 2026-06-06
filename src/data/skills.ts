import type { SkillCategory } from './types';

export const skillCategories: SkillCategory[] = [
  {
    id: 'platforms',
    label: { pt: 'Plataformas de Dados', en: 'Data Platforms' },
    accent: 'blue',
    skills: [
      { name: 'Microsoft Fabric', level: 'core' },
      { name: 'Databricks', level: 'core' },
      { name: 'Azure', level: 'core' },
      { name: 'AWS', level: 'proficient' },
      { name: 'GCP', level: 'familiar' },
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
      { name: 'Spark SQL', level: 'core' },
      { name: 'DAX', level: 'familiar' },
      { name: 'R', level: 'familiar' },
    ],
  },
  {
    id: 'storage',
    label: { pt: 'Storage & Integração', en: 'Storage & Integration' },
    accent: 'blue',
    skills: [
      { name: 'Azure Data Factory', level: 'proficient' },
      { name: 'OneLake', level: 'proficient' },
      { name: 'MongoDB', level: 'proficient' },
      { name: 'AWS S3 / Glue / Lambda', level: 'proficient' },
    ],
  },
  {
    id: 'quality',
    label: { pt: 'Qualidade & Governança', en: 'Quality & Governance' },
    accent: 'cyan',
    skills: [
      { name: 'Unity Catalog', level: 'core' },
      { name: 'DQX', level: 'core' },
      { name: 'Great Expectations', level: 'proficient' },
      { name: 'Data Contracts', level: 'proficient' },
      { name: 'Power BI', level: 'proficient' },
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
