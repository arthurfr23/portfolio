import type { LinkedInProject } from './types';

export const linkedInProjects: LinkedInProject[] = [
  {
    title: {
      pt: 'Fabric Foundry Agentic System',
      en: 'Fabric Foundry Agentic System',
    },
    startDate: '2026-08',
    endDate: null,
    description: {
      pt: 'Sistema multi-agente que executa tarefas de ETL no Microsoft Fabric a partir de work items do Azure DevOps, com agentes hospedados no Azure AI Foundry. Três agentes por papel seguem o fluxo Receber → Refinar → Realizar → Analisar: o PM transforma o ticket em especificação com critérios de aceite, o Engineer executa via Fabric REST API com permissões escopadas por cenário e o QA valida o resultado de forma independente, com acesso somente leitura.\n\nCenários de Bronze, Silver, Gold e modelo semântico, com seleção de modelo por papel guiada pelo Azure AI Evaluation SDK.',
      en: 'Multi-agent system that executes ETL tasks in Microsoft Fabric from Azure DevOps work items, with agents hosted on Azure AI Foundry. Three role-based agents follow a Receive → Refine → Execute → Analyze flow: the PM turns the ticket into a spec with acceptance criteria, the Engineer executes through the Fabric REST API with scenario-scoped permissions, and the QA independently validates the result with read-only access.\n\nScenarios cover Bronze, Silver, Gold and semantic models, with per-role model selection driven by the Azure AI Evaluation SDK.',
    },
    tags: ['Azure AI Foundry', 'Microsoft Fabric', 'Multi-agent', 'Azure DevOps'],
  },
  {
    title: {
      pt: 'OpenAI Agents',
      en: 'OpenAI Agents',
    },
    startDate: '2026-06',
    endDate: null,
    description: {
      pt: 'Sistema multi-agente que gera recomendações de revisão em Pull Requests usando modelos da OpenAI (ChatGPT), integrado ao fluxo do GitHub via GitHub Actions. Agentes especializados analisam as mudanças de código Spark e SQL e publicam sugestões direto no PR, acelerando o ciclo de revisão do time.',
      en: 'Multi-agent system that generates review recommendations on Pull Requests using OpenAI (ChatGPT) models, integrated into the GitHub workflow through GitHub Actions. Specialized agents analyze Spark and SQL code changes and post suggestions directly on the PR, speeding up the team\'s review cycle.',
    },
    tags: ['OpenAI', 'Multi-agent', 'GitHub Actions', 'Python'],
  },
  {
    title: {
      pt: 'Migração Databricks: Azure para AWS',
      en: 'Databricks Migration: Azure to AWS',
    },
    startDate: '2026-05',
    endDate: '2026-07',
    description: {
      pt: 'Migração de uma plataforma Databricks do Azure para a AWS: recriação da governança no Unity Catalog (metastore, storage credentials e external locations no S3), cópia das tabelas Delta com validação de contagem e consistência, e redeploy de jobs e workflows via Databricks Asset Bundles. O cutover foi planejado por domínio para minimizar a indisponibilidade para as áreas de negócio.',
      en: 'Migration of a Databricks platform from Azure to AWS: rebuilt Unity Catalog governance (metastore, storage credentials and external locations on S3), copied Delta tables with row-count and consistency validation, and redeployed jobs and workflows through Databricks Asset Bundles. Cutover was planned per domain to minimize downtime for business teams.',
    },
    tags: ['Databricks', 'AWS', 'Unity Catalog', 'Delta Lake', 'DABs'],
  },
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
      pt: 'CI/CD para Vibe Coding com GitHub',
      en: 'CI/CD for Vibe Coding with GitHub',
    },
    startDate: '2026-01',
    endDate: '2026-03',
    description: {
      pt: 'Template corporativo e esteira de CI/CD para que áreas de negócio criem aplicações web internas via Vibe Coding, conversando com agentes de IA sem tocar em código ou terminal. O time de dados provisiona a infraestrutura (repositório, banco e variáveis de ambiente) e as regras de arquitetura ficam versionadas em AGENTS.md/CLAUDE.md para qualquer agente seguir.\n\nGovernança embutida no fluxo: RLS obrigatório em todas as tabelas, chaves privilegiadas fora do código da aplicação e auditoria de conformidade antes do deploy em produção.\n\nStack: Next.js, TypeScript, Tailwind CSS, Supabase, GitHub, Vercel.',
      en: 'Corporate template and CI/CD pipeline that lets business teams build internal web apps through Vibe Coding, talking to AI agents without touching code or the terminal. The data team provisions the infrastructure (repository, database and environment variables), and architecture rules are versioned in AGENTS.md/CLAUDE.md for any agent to follow.\n\nGovernance is built into the flow: mandatory RLS on every table, privileged keys kept out of application code, and a compliance audit before production deploys.\n\nStack: Next.js, TypeScript, Tailwind CSS, Supabase, GitHub, Vercel.',
    },
    tags: ['CI/CD', 'GitHub', 'Vibe Coding', 'Supabase', 'Next.js'],
  },
  {
    title: {
      pt: 'Databricks Platform Refactoring & Optimization',
      en: 'Databricks Platform Refactoring & Optimization',
    },
    startDate: '2026-01',
    endDate: '2026-05',
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
    description: {
      pt: 'Classificação automática de gênero em banco de dados legado usando a biblioteca gender_guesser.detector do Python. O resultado foi o preenchimento da tabela com assertividade de aproximadamente 87% (calculada a partir de corpus reduzido).',
      en: 'Automatic gender classification in a legacy database using Python\'s gender_guesser.detector library. Achieved approximately 87% accuracy (calculated from a reduced corpus).',
    },
    tags: ['Python', 'AI', 'Data Quality'],
    caseSlug: 'genero-ia',
  },
];
