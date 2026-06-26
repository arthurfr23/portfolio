import type { LinkedInProject } from './types';

export const linkedInProjects: LinkedInProject[] = [
  {
    title: {
      pt: 'data-agents-copilot',
      en: 'data-agents-copilot',
    },
    startDate: '2026-02',
    endDate: null,
    description: {
      pt: 'Sistema de despacho automático que roteia tarefas de dados (SQL, PySpark, pipelines, governança) para 15 agentes IA especializados. Executado via CLI, Chainlit web, ou diretamente no VS Code Chat.\n\nFork do projeto original data-agents de Thomaz Rossito — adaptado para operar com GitHub Copilot Chat API, adicionando governança automática de nomenclatura, workflows colaborativos multi-agente, Knowledge Base estruturada, sistema de memória episódica e protocolo QA peer-to-peer.',
      en: 'Automatic dispatch system that routes data tasks (SQL, PySpark, pipelines, governance) to 15 specialized AI agents. Runs via CLI, Chainlit web, or directly in VS Code Chat.\n\nFork of the original data-agents project by Thomaz Rossito — adapted to run with GitHub Copilot Chat API, adding automatic naming governance, collaborative multi-agent workflows, structured Knowledge Base, episodic memory system and peer-to-peer QA protocol.',
    },
    url: 'https://github.com/arthurfr23/data-agents-copilot',
    tags: ['Python', 'Multi-agent', 'LLM', 'Databricks', 'Fabric'],
    caseSlug: 'data-agents-copilot',
  },
  {
    title: {
      pt: 'Databricks Platform Refactoring & Optimization',
      en: 'Databricks Platform Refactoring & Optimization',
    },
    startDate: '2026-01',
    endDate: '2026-05',
    company: 'Power Tuning',
    description: {
      pt: 'Projeto de refactoring e otimização de uma plataforma de dados baseada em Databricks, com foco em performance, manutenibilidade e cumprimento de SLA crítico de 15 minutos. Após redesign completo do framework e otimizações em PySpark, SQL e arquitetura, a solução atingiu o SLA e se tornou mais escalável, estável e fácil de manter.',
      en: 'Refactoring and optimization project for a Databricks-based data platform focused on performance, maintainability, and critical SLA compliance. After a complete framework redesign and optimizations in PySpark, SQL, and platform architecture, the solution successfully achieved the 15-minute SLA while becoming more scalable, stable, and easier to maintain.',
    },
    tags: ['Databricks', 'PySpark', 'SQL', 'Delta Lake'],
    caseSlug: 'databricks-refactoring',
  },
  {
    title: {
      pt: 'Otimização de ETL no Databricks',
      en: 'ETL Optimization on Databricks',
    },
    startDate: '2025-07',
    endDate: '2025-09',
    description: {
      pt: 'Otimização de pipelines ETL críticos no Databricks aplicando BroadcastJoin, CLUSTER BY, OPTIMIZE e leitura incremental. Os pipelines passaram por reduções de até 94% no tempo de execução, com impacto direto no consumo de DBU e nas janelas de processamento.',
      en: 'Optimization of critical ETL pipelines on Databricks using BroadcastJoin, CLUSTER BY, OPTIMIZE and incremental reads. Pipelines achieved up to 94% runtime reduction, with direct impact on DBU consumption and processing windows.',
    },
    tags: ['Databricks', 'PySpark', 'Spark SQL', 'Delta Lake'],
    caseSlug: 'spark-etl-optimization',
  },
  {
    title: {
      pt: 'Lakehouse no Azure',
      en: 'Lakehouse on Azure',
    },
    startDate: '2025-09',
    endDate: '2026-01',
    company: 'Power Tuning',
    description: {
      pt: 'Concepção e implementação de um Lakehouse corporativo para grande empresa brasileira com arquitetura medalhão (Bronze, Silver e Gold), integrando múltiplas fontes com destaque para o ERP Protheus. Workspaces segregados por domínio de negócio integrados a um workspace central de Engenharia. Cargas orquestradas via Azure Data Factory com pipelines parametrizados e controlados por SLA.',
      en: 'Designed and implemented a corporate Lakehouse for a major Brazilian company using the medallion architecture (Bronze, Silver and Gold), integrating multiple data sources with focus on ERP Protheus. Business-domain workspaces integrated into a central Engineering workspace for governance and standardization. Data loads orchestrated via Azure Data Factory with parameterized, SLA-controlled pipelines.',
    },
    tags: ['Microsoft Fabric', 'Azure Data Factory', 'Delta Lake', 'Medallion'],
    caseSlug: 'lakehouse-azure',
  },
  {
    title: {
      pt: 'App Modernization',
      en: 'App Modernization',
    },
    startDate: '2025-05',
    endDate: '2025-08',
    company: 'Kumulus',
    description: {
      pt: 'Migração completa de Data Warehouse On-Premise para arquitetura Lakehouse no Microsoft Fabric: modelagem dimensional, pipelines de ingestão e transformação, migração de procedures SQL para Lakehouse e publicação de relatórios em Power BI com conexão ao Lakehouse.\n\nStack: Microsoft Fabric, OneLake, Data Factory, PySpark, Synapse Data Warehouse, Power BI, T-SQL, Delta Lake.',
      en: 'Full migration from an On-Premise Data Warehouse to Lakehouse architecture on Microsoft Fabric: dimensional modeling, ingestion and transformation pipelines, SQL procedure migration to Lakehouse, and publishing reports and dashboards in Power BI connected to the Lakehouse.\n\nStack: Microsoft Fabric, OneLake, Data Factory, PySpark, Synapse Data Warehouse, Power BI, T-SQL, Delta Lake.',
    },
    tags: ['Microsoft Fabric', 'PySpark', 'Power BI', 'T-SQL'],
    caseSlug: 'app-modernization',
  },
  {
    title: {
      pt: 'Implementação e testes de IA',
      en: 'AI Implementation and Testing',
    },
    startDate: '2025-02',
    endDate: '2025-07',
    company: 'Paytime',
    description: {
      pt: 'Integração dos dados da empresa com a IA do Databricks (Genie) para acelerar processos e fomentar a cultura Data-Driven. Realização de testes e difusão da utilização da ferramenta em toda a empresa.',
      en: 'Integration of company data with Databricks AI (Genie) to accelerate processes and foster a Data-Driven culture. Conducted testing and promoted tool adoption across the company.',
    },
    tags: ['Databricks', 'Genie', 'AI', 'Analytics'],
    caseSlug: 'ia-genie',
  },
  {
    title: {
      pt: 'Migração de dados do MongoDB para o Databricks',
      en: 'MongoDB to Databricks Data Migration',
    },
    startDate: '2025-03',
    endDate: '2025-03',
    company: 'Paytime',
    description: {
      pt: 'Migração de banco de dados MongoDB para Databricks utilizando MongoDB Data Federation, AWS S3 e rotinas de carga incremental com Spark. O resultado foi uma rotina regular de atualização dos dados mais robustos da empresa, inclusive transações com milhões de linhas.',
      en: 'Migration of a MongoDB database to Databricks using MongoDB Data Federation, AWS S3, and incremental load routines with Spark. The result was a regular update routine for the company\'s most critical data, including transaction tables with millions of rows.',
    },
    tags: ['MongoDB', 'Databricks', 'Spark', 'AWS S3'],
    caseSlug: 'mongodb-databricks',
  },
  {
    title: {
      pt: 'Desenvolvimento do Lakehouse',
      en: 'Lakehouse Development',
    },
    startDate: '2024-11',
    endDate: '2025-03',
    company: 'Paytime',
    description: {
      pt: 'Implementação de um Lakehouse no Databricks integrando toda a base de dados de uma Fintech com SQL, Spark, Databricks e AWS. O resultado foi o aumento de performance nas análises e na atualização de relatórios e painéis.',
      en: 'Implementation of a Lakehouse on Databricks integrating all data from a Fintech using SQL, Spark, Databricks and AWS. The result was improved performance in analytics and report/dashboard updates.',
    },
    tags: ['Databricks', 'Spark', 'SQL', 'AWS', 'Delta Lake'],
    caseSlug: 'lakehouse-fintech',
  },
  {
    title: {
      pt: 'Portal de Dashboards',
      en: 'Dashboard Portal',
    },
    startDate: '2024-10',
    endDate: '2025-01',
    company: 'Paytime',
    description: {
      pt: 'Criação de Portal de Dashboards que reduziu o custo de licenças Power BI de R$ 45/licença para R$ 5/licença. A redução de custos e a potência da plataforma levaram à extensão do Portal para mais de 500 clientes da empresa, transformando-o em um produto de dados.',
      en: 'Created a Dashboard Portal that reduced Power BI license costs from R$45/license to R$5/license. The cost reduction and platform capabilities led to extending the Portal to over 500 company clients, turning it into a data product.',
    },
    tags: ['Power BI', 'Databricks', 'SQL'],
    caseSlug: 'portal-dashboards',
  },
  {
    title: {
      pt: 'Definição de gêneros usando IA',
      en: 'Gender Classification using AI',
    },
    startDate: '2023-11',
    endDate: '2023-12',
    company: 'Piwi',
    description: {
      pt: 'Classificação automática de gênero em banco de dados legado usando a biblioteca gender_guesser.detector do Python. O resultado foi o preenchimento da tabela com assertividade de aproximadamente 87% (calculada a partir de corpus reduzido).',
      en: 'Automatic gender classification in a legacy database using Python\'s gender_guesser.detector library. Achieved approximately 87% accuracy (calculated from a reduced corpus).',
    },
    tags: ['Python', 'AI', 'Data Quality'],
    caseSlug: 'genero-ia',
  },
];
