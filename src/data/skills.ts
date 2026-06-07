import type { SkillCategory } from './types';

export const skillCategories: SkillCategory[] = [
  {
    id: 'data-engineering',
    label: { pt: 'Engenharia de Dados', en: 'Data Engineering' },
    accent: 'blue',
    skills: [
      { name: 'Microsoft Fabric', level: 'core' },
      { name: 'Databricks', level: 'core' },
      { name: 'Azure', level: 'core' },
      { name: 'PySpark', level: 'core' },
      { name: 'Delta Lake', level: 'proficient' },
      { name: 'Azure Data Factory', level: 'proficient' },
      { name: 'AWS', level: 'proficient' },
      { name: 'GCP', level: 'familiar' },
      { name: 'Snowflake', level: 'familiar' },
    ],
  },
  {
    id: 'sql-spark',
    label: { pt: 'SQL & Spark', en: 'SQL & Spark' },
    accent: 'cyan',
    skills: [
      { name: 'SQL', level: 'core' },
      { name: 'Spark SQL', level: 'core' },
      { name: 'Python', level: 'core' },
      { name: 'DAX', level: 'familiar' },
      { name: 'R', level: 'familiar' },
    ],
  },
  {
    id: 'quality',
    label: { pt: 'Qualidade & Governança', en: 'Quality & Governance' },
    accent: 'emerald',
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
    accent: 'blue',
    skills: [
      { name: 'Multi-agent Systems', level: 'proficient' },
      { name: 'RAG', level: 'proficient' },
      { name: 'Prompt Engineering', level: 'proficient' },
      { name: 'Mosaic AI', level: 'familiar' },
      { name: 'MCP', level: 'familiar' },
    ],
  },
];
