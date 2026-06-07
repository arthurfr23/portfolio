import type { CaseStudy } from './types';

export const caseStudies: CaseStudy[] = [
  {
    slug: 'data-agents-copilot',
    projectTitle: {
      pt: 'data-agents-copilot: sistema multi-agente para dados',
      en: 'data-agents-copilot: a multi-agent system for data',
    },
    company: 'Projeto pessoal',
    period: '2026',
    summary: {
      pt: 'Um roteador que distribui tarefas de dados para 15 agentes de IA especializados, com governança, memória e MCP.',
      en: 'A router that dispatches data tasks to 15 specialized AI agents, with governance, memory and MCP.',
    },
    problem: {
      pt: 'Tarefas de engenharia de dados (SQL, PySpark, pipelines, governança) exigem contextos e padrões muito diferentes entre si. Um único assistente genérico erra naming, ignora boas práticas e não mantém contexto entre interações.',
      en: 'Data engineering tasks (SQL, PySpark, pipelines, governance) require very different contexts and standards. A single generic assistant gets naming wrong, ignores best practices and loses context between interactions.',
    },
    solution: {
      pt: [
        'Roteador que identifica o domínio da tarefa e despacha para o agente especialista certo.',
        '15 agentes especializados (Spark, SQL, Pipeline, Data Quality, Governança, etc.).',
        'Governança automática de nomenclatura e workflows colaborativos multi-agente.',
        'Knowledge Base estruturada, memória episódica e protocolo de QA peer-to-peer.',
        'Execução via CLI, Chainlit (web) ou direto no VS Code, com servidores MCP.',
      ],
      en: [
        'Router that identifies the task domain and dispatches to the right specialist agent.',
        '15 specialized agents (Spark, SQL, Pipeline, Data Quality, Governance, etc.).',
        'Automatic naming governance and collaborative multi-agent workflows.',
        'Structured Knowledge Base, episodic memory and peer-to-peer QA protocol.',
        'Runs via CLI, Chainlit (web) or directly in VS Code, with MCP servers.',
      ],
    },
    results: {
      pt: [
        'Respostas especializadas e consistentes com os padrões de cada domínio.',
        'Contexto preservado entre interações via memória.',
        'Base extensível para novos agentes e integrações.',
      ],
      en: [
        'Specialized answers consistent with each domain\'s standards.',
        'Context preserved across interactions via memory.',
        'Extensible foundation for new agents and integrations.',
      ],
    },
    stack: ['Python', 'GitHub Copilot API', 'MCP', 'Chainlit', 'LLM'],
    repoUrl: 'https://github.com/arthurfr23/data-agents-copilot',
    mermaid: {
      pt: `flowchart TB
  U[Usuario - CLI / VS Code / Web] --> R[Roteador / Supervisor]
  R --> A1[Spark Expert]
  R --> A2[SQL Expert]
  R --> A3[Pipeline Architect]
  R --> A4[Data Quality]
  R --> A5[Governanca]
  A1 --> KB[(Knowledge Base + Memoria)]
  A2 --> KB
  A3 --> KB
  A4 --> KB
  A5 --> KB
  R --> MCP[MCP Servers]
  classDef hub fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef store fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class U,R,A1,A2,A3,A4,A5,MCP hub
  class KB store`,
      en: `flowchart TB
  U[User - CLI / VS Code / Web] --> R[Router / Supervisor]
  R --> A1[Spark Expert]
  R --> A2[SQL Expert]
  R --> A3[Pipeline Architect]
  R --> A4[Data Quality]
  R --> A5[Governance]
  A1 --> KB[(Knowledge Base + Memory)]
  A2 --> KB
  A3 --> KB
  A4 --> KB
  A5 --> KB
  R --> MCP[MCP Servers]
  classDef hub fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef store fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class U,R,A1,A2,A3,A4,A5,MCP hub
  class KB store`,
    },
  },
  {
    slug: 'databricks-refactoring',
    projectTitle: {
      pt: 'Refatoração de plataforma Databricks para SLA crítico',
      en: 'Databricks platform refactoring for a critical SLA',
    },
    company: 'Power Tuning',
    period: '2026',
    summary: {
      pt: 'Redesenho de um framework complexo para entregar dados dentro de um SLA de 15 minutos.',
      en: 'Redesign of a complex framework to deliver data within a 15-minute SLA.',
    },
    problem: {
      pt: 'A plataforma dependia de um framework altamente complexo que dificultava a manutenção e impedia a entrega de dados dentro do SLA crítico de 15 minutos exigido pelo negócio.',
      en: 'The platform relied on a highly complex framework that made maintenance hard and prevented data delivery within the business-critical 15-minute SLA.',
    },
    solution: {
      pt: [
        'Redesenhei o framework por completo, simplificando arquitetura e manutenção.',
        'Otimizei transformações em PySpark e SQL (particionamento, joins, cache).',
        'Reestruturei a orquestração para paralelizar etapas e reduzir o caminho crítico.',
        'Introduzi observabilidade para acompanhar o SLA em produção.',
      ],
      en: [
        'Completely redesigned the framework, simplifying architecture and maintenance.',
        'Optimized PySpark and SQL transformations (partitioning, joins, caching).',
        'Restructured orchestration to parallelize steps and shorten the critical path.',
        'Introduced observability to track the SLA in production.',
      ],
    },
    results: {
      pt: [
        'SLA de 15 minutos atingido de forma consistente.',
        'Plataforma mais escalável, estável e fácil de manter.',
        'Redução significativa do esforço de manutenção da equipe.',
      ],
      en: [
        '15-minute SLA consistently achieved.',
        'More scalable, stable and maintainable platform.',
        'Significant reduction in team maintenance effort.',
      ],
    },
    stack: ['Databricks', 'PySpark', 'SQL', 'Delta Lake', 'Azure'],
    mermaid: {
      pt: `flowchart TB
  subgraph Antes
    A1[Framework complexo] --> A2[Manutencao dificil]
    A2 --> A3[SLA estourado > 15min]
  end
  subgraph Depois
    B1[Framework redesenhado] --> B2[PySpark + SQL otimizados]
    B2 --> B3[Orquestracao paralela]
    B3 --> B4[SLA 15min atingido]
  end
  A3 -.refatoracao.-> B1
  classDef bad fill:#1a1018,stroke:#ef4444,color:#e2e8f0
  classDef good fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class A1,A2,A3 bad
  class B1,B2,B3,B4 good`,
      en: `flowchart TB
  subgraph Before
    A1[Complex framework] --> A2[Hard to maintain]
    A2 --> A3[SLA missed > 15min]
  end
  subgraph After
    B1[Redesigned framework] --> B2[Optimized PySpark + SQL]
    B2 --> B3[Parallel orchestration]
    B3 --> B4[15min SLA met]
  end
  A3 -.refactor.-> B1
  classDef bad fill:#1a1018,stroke:#ef4444,color:#e2e8f0
  classDef good fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class A1,A2,A3 bad
  class B1,B2,B3,B4 good`,
    },
  },
  {
    slug: 'lakehouse-azure',
    projectTitle: {
      pt: 'Lakehouse corporativo no Azure com arquitetura medalhão',
      en: 'Corporate Lakehouse on Azure with medallion architecture',
    },
    company: 'Power Tuning',
    period: '2025–2026',
    summary: {
      pt: 'Lakehouse para grande empresa brasileira integrando o ERP Protheus e múltiplas fontes, com governança por domínio.',
      en: 'Lakehouse for a large Brazilian company integrating ERP Protheus and multiple sources, with domain-based governance.',
    },
    problem: {
      pt: 'A empresa precisava consolidar dados de múltiplas fontes (com destaque para o ERP Protheus) em uma plataforma única, com diferentes níveis de criticidade e rotinas de atualização por área de negócio.',
      en: 'The company needed to consolidate data from multiple sources (notably ERP Protheus) into a single platform, with different criticality levels and refresh routines per business area.',
    },
    solution: {
      pt: [
        'Arquitetura medalhão (Bronze, Silver, Gold) para ingestão, tratamento e disponibilização.',
        'Workspaces segregados por domínio de negócio, integrados a um workspace central de Engenharia.',
        'Orquestração via Azure Data Factory com pipelines parametrizados e controlados por SLA.',
        'Governança, isolamento e padronização de processos entre os domínios.',
      ],
      en: [
        'Medallion architecture (Bronze, Silver, Gold) for ingestion, processing and delivery.',
        'Business-domain workspaces integrated into a central Engineering workspace.',
        'Orchestration via Azure Data Factory with parameterized, SLA-controlled pipelines.',
        'Governance, isolation and process standardization across domains.',
      ],
    },
    results: {
      pt: [
        'Plataforma de dados robusta, governável e escalável.',
        'Agendamentos flexíveis e reaproveitamento de lógica entre pipelines.',
        'Alinhamento às necessidades operacionais e analíticas da organização.',
      ],
      en: [
        'Robust, governable and scalable data platform.',
        'Flexible scheduling and logic reuse across pipelines.',
        'Aligned with the organization\'s operational and analytical needs.',
      ],
    },
    stack: ['Microsoft Fabric', 'Azure Data Factory', 'Delta Lake', 'PySpark', 'Power BI'],
    mermaid: {
      pt: `flowchart LR
  ERP[ERP Protheus] --> ADF[Azure Data Factory]
  SRC[Outras fontes] --> ADF
  ADF --> B[Bronze]
  B --> S[Silver]
  S --> G[Gold]
  G --> WS[Workspaces por dominio]
  WS --> BI[Power BI / Consumo]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class ERP,SRC,ADF,B,S a
  class G,WS,BI g`,
      en: `flowchart LR
  ERP[ERP Protheus] --> ADF[Azure Data Factory]
  SRC[Other sources] --> ADF
  ADF --> B[Bronze]
  B --> S[Silver]
  S --> G[Gold]
  G --> WS[Domain workspaces]
  WS --> BI[Power BI / Consumption]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class ERP,SRC,ADF,B,S a
  class G,WS,BI g`,
    },
  },
  {
    slug: 'app-modernization',
    projectTitle: {
      pt: 'Migração de Data Warehouse on-premise para Microsoft Fabric',
      en: 'On-premise Data Warehouse migration to Microsoft Fabric',
    },
    company: 'Kumulus',
    period: '2025',
    summary: {
      pt: 'Migração completa de um DW on-premise para arquitetura Lakehouse no Microsoft Fabric.',
      en: 'Full migration of an on-premise DW to a Lakehouse architecture on Microsoft Fabric.',
    },
    problem: {
      pt: 'Um Data Warehouse on-premise limitava escalabilidade e modernização. Era preciso migrar modelagem, pipelines, procedures SQL e relatórios para a nuvem sem perder consistência.',
      en: 'An on-premise Data Warehouse limited scalability and modernization. Modeling, pipelines, SQL procedures and reports had to move to the cloud without losing consistency.',
    },
    solution: {
      pt: [
        'Modelagem dimensional e otimização de schema na nova plataforma.',
        'Criação e ajuste de pipelines de ingestão e transformação com o Fabric.',
        'Migração e reimplementação de procedures SQL para o ambiente Lakehouse.',
        'Publicação e ajuste de relatórios e dashboards em Power BI conectados ao Lakehouse.',
      ],
      en: [
        'Dimensional modeling and schema optimization on the new platform.',
        'Built and tuned ingestion and transformation pipelines with Fabric.',
        'Migrated and re-implemented SQL procedures to the Lakehouse environment.',
        'Published and tuned Power BI reports and dashboards connected to the Lakehouse.',
      ],
    },
    results: {
      pt: [
        'Plataforma moderna, escalável e na nuvem.',
        'Pipelines de ingestão e transformação padronizados no Fabric.',
        'Relatórios servidos diretamente do Lakehouse.',
      ],
      en: [
        'Modern, scalable, cloud-based platform.',
        'Standardized ingestion and transformation pipelines on Fabric.',
        'Reports served directly from the Lakehouse.',
      ],
    },
    stack: ['Microsoft Fabric', 'OneLake', 'PySpark', 'Synapse', 'Power BI', 'T-SQL'],
    mermaid: {
      pt: `flowchart LR
  DW[(DW On-Premise)] --> MIG[Migracao]
  MIG --> F[Microsoft Fabric / OneLake]
  F --> LH[Lakehouse]
  LH --> PROC[Pipelines + PySpark]
  PROC --> SQLW[Synapse DW / T-SQL]
  SQLW --> PBI[Power BI]
  classDef old fill:#1a1018,stroke:#f59e0b,color:#e2e8f0
  classDef new fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class DW,MIG old
  class F,LH,PROC,SQLW,PBI new`,
      en: `flowchart LR
  DW[(On-Premise DW)] --> MIG[Migration]
  MIG --> F[Microsoft Fabric / OneLake]
  F --> LH[Lakehouse]
  LH --> PROC[Pipelines + PySpark]
  PROC --> SQLW[Synapse DW / T-SQL]
  SQLW --> PBI[Power BI]
  classDef old fill:#1a1018,stroke:#f59e0b,color:#e2e8f0
  classDef new fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class DW,MIG old
  class F,LH,PROC,SQLW,PBI new`,
    },
  },
  {
    slug: 'ia-genie',
    projectTitle: {
      pt: 'Analytics conversacional com Databricks Genie',
      en: 'Conversational analytics with Databricks Genie',
    },
    company: 'Paytime',
    period: '2025',
    summary: {
      pt: 'Integração dos dados da empresa com a IA do Databricks (Genie) para acelerar a cultura data-driven.',
      en: 'Integration of company data with Databricks AI (Genie) to accelerate the data-driven culture.',
    },
    problem: {
      pt: 'Times de negócio dependiam da equipe de dados para responder perguntas simples, criando gargalo e atrasando decisões.',
      en: 'Business teams depended on the data team to answer simple questions, creating a bottleneck and delaying decisions.',
    },
    solution: {
      pt: [
        'Integração dos dados governados (Unity Catalog) com o Databricks Genie.',
        'Configuração de espaços de perguntas em linguagem natural sobre os dados.',
        'Testes de assertividade e curadoria dos contextos para respostas confiáveis.',
        'Difusão e habilitação do uso da ferramenta entre as áreas.',
      ],
      en: [
        'Integrated governed data (Unity Catalog) with Databricks Genie.',
        'Set up natural-language question spaces over the data.',
        'Accuracy testing and context curation for reliable answers.',
        'Promoted and enabled tool adoption across teams.',
      ],
    },
    results: {
      pt: [
        'Autoatendimento analítico para times de negócio.',
        'Menos dependência da equipe de dados para perguntas recorrentes.',
        'Aceleração da cultura data-driven na empresa.',
      ],
      en: [
        'Analytical self-service for business teams.',
        'Less dependence on the data team for recurring questions.',
        'Accelerated data-driven culture across the company.',
      ],
    },
    stack: ['Databricks', 'Genie', 'Unity Catalog', 'SQL'],
    mermaid: {
      pt: `flowchart LR
  D[(Lakehouse Databricks)] --> UC[Unity Catalog]
  UC --> GEN[Databricks Genie]
  USERS[Times de negocio] --> Q[Perguntas em linguagem natural]
  Q --> GEN
  GEN --> INS[Insights / Self-service]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class D,UC,GEN a
  class USERS,Q,INS g`,
      en: `flowchart LR
  D[(Databricks Lakehouse)] --> UC[Unity Catalog]
  UC --> GEN[Databricks Genie]
  USERS[Business teams] --> Q[Natural language questions]
  Q --> GEN
  GEN --> INS[Insights / Self-service]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class D,UC,GEN a
  class USERS,Q,INS g`,
    },
  },
  {
    slug: 'mongodb-databricks',
    projectTitle: {
      pt: 'Migração de MongoDB para o Databricks',
      en: 'MongoDB to Databricks migration',
    },
    company: 'Paytime',
    period: '2025',
    summary: {
      pt: 'Migração de um banco MongoDB para o Lakehouse com carga incremental de tabelas de milhões de linhas.',
      en: 'Migration of a MongoDB database to the Lakehouse with incremental loading of million-row tables.',
    },
    problem: {
      pt: 'Os dados mais críticos da empresa viviam em MongoDB, dificultando análises em escala e integração com o restante da plataforma — incluindo tabelas de transações com milhões de linhas.',
      en: 'The company\'s most critical data lived in MongoDB, making large-scale analytics and platform integration hard — including transaction tables with millions of rows.',
    },
    solution: {
      pt: [
        'Uso do MongoDB Data Federation para expor os dados.',
        'Camada de staging em AWS S3 como ponte para o Databricks.',
        'Rotinas de carga incremental com Spark para processar grandes volumes.',
        'Materialização em Delta Lake com atualização regular.',
      ],
      en: [
        'Used MongoDB Data Federation to expose the data.',
        'AWS S3 staging layer as a bridge into Databricks.',
        'Incremental load routines with Spark to handle large volumes.',
        'Materialization in Delta Lake with regular updates.',
      ],
    },
    results: {
      pt: [
        'Dados críticos disponíveis para análise no Lakehouse.',
        'Rotina regular e robusta de atualização, inclusive para transações com milhões de linhas.',
        'Integração do MongoDB ao restante da plataforma de dados.',
      ],
      en: [
        'Critical data available for analytics in the Lakehouse.',
        'Robust, regular update routine, even for million-row transaction tables.',
        'MongoDB integrated into the rest of the data platform.',
      ],
    },
    stack: ['MongoDB', 'AWS S3', 'Databricks', 'Spark', 'Delta Lake'],
    mermaid: {
      pt: `flowchart LR
  M[(MongoDB)] --> DF[Mongo Data Federation]
  DF --> S3[(AWS S3)]
  S3 --> SP[Spark / Databricks]
  SP --> INC[Carga incremental]
  INC --> DL[(Delta Lake)]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class M,DF,S3,SP a
  class INC,DL g`,
      en: `flowchart LR
  M[(MongoDB)] --> DF[Mongo Data Federation]
  DF --> S3[(AWS S3)]
  S3 --> SP[Spark / Databricks]
  SP --> INC[Incremental load]
  INC --> DL[(Delta Lake)]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class M,DF,S3,SP a
  class INC,DL g`,
    },
  },
  {
    slug: 'lakehouse-fintech',
    projectTitle: {
      pt: 'Lakehouse de uma fintech do zero',
      en: 'A fintech Lakehouse from scratch',
    },
    company: 'Paytime',
    period: '2024–2025',
    summary: {
      pt: 'Implementação de um Lakehouse no Databricks integrando toda a base de dados de uma fintech.',
      en: 'Implementation of a Databricks Lakehouse integrating an entire fintech database.',
    },
    problem: {
      pt: 'A fintech não tinha uma plataforma de dados unificada: análises e relatórios eram lentos e a base estava fragmentada entre sistemas.',
      en: 'The fintech lacked a unified data platform: analytics and reports were slow and data was fragmented across systems.',
    },
    solution: {
      pt: [
        'Design e implementação do Lakehouse (Databricks, Spark, SQL, AWS) do zero.',
        'Integração de toda a base de dados em camadas Bronze, Silver e Gold.',
        'Práticas de governança: testes de qualidade, documentação e controle de acesso.',
        'Fundação para produtos de dados e analytics self-service.',
      ],
      en: [
        'Designed and implemented the Lakehouse (Databricks, Spark, SQL, AWS) from scratch.',
        'Integrated the entire database into Bronze, Silver and Gold layers.',
        'Governance practices: quality testing, documentation and access control.',
        'Foundation for data products and self-service analytics.',
      ],
    },
    results: {
      pt: [
        'Aumento de performance nas análises.',
        'Atualização mais rápida de relatórios e painéis.',
        'Base sólida para os primeiros produtos de dados da empresa.',
      ],
      en: [
        'Improved analytics performance.',
        'Faster report and dashboard updates.',
        'Solid foundation for the company\'s first data products.',
      ],
    },
    stack: ['Databricks', 'Spark', 'SQL', 'AWS', 'Delta Lake'],
    mermaid: {
      pt: `flowchart LR
  SRC[Fontes da fintech] --> ING[Ingestao Spark]
  ING --> B[Bronze]
  B --> S[Silver]
  S --> G[Gold]
  G --> REP[Relatorios e Paineis]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class SRC,ING,B,S a
  class G,REP g`,
      en: `flowchart LR
  SRC[Fintech sources] --> ING[Spark ingestion]
  ING --> B[Bronze]
  B --> S[Silver]
  S --> G[Gold]
  G --> REP[Reports and dashboards]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class SRC,ING,B,S a
  class G,REP g`,
    },
  },
  {
    slug: 'portal-dashboards',
    projectTitle: {
      pt: 'Portal de Dashboards como produto de dados',
      en: 'Dashboard Portal as a data product',
    },
    company: 'Paytime',
    period: '2024–2025',
    summary: {
      pt: 'Como um portal de dashboards reduziu o custo de BI em 9x e virou um produto para 500+ clientes.',
      en: 'How a dashboard portal cut BI cost by 9x and became a product for 500+ clients.',
    },
    problem: {
      pt: 'O custo de licenças de Power BI (R$ 45 por usuário) inviabilizava escalar BI para todos os clientes da fintech. Cada novo cliente aumentava o custo de forma linear, limitando o alcance da plataforma.',
      en: 'Power BI license cost (R$45 per user) made it unfeasible to scale BI to all of the fintech\'s clients. Every new client increased cost linearly, limiting the platform\'s reach.',
    },
    solution: {
      pt: [
        'Lakehouse no Databricks como camada única de dados confiáveis (Bronze→Silver→Gold).',
        'Portal de Dashboards próprio servindo as visualizações direto da camada Gold.',
        'Substituição das licenças individuais de Power BI por acesso via portal.',
        'Padronização de governança e qualidade para garantir confiança nos números.',
      ],
      en: [
        'Databricks Lakehouse as a single trusted data layer (Bronze→Silver→Gold).',
        'Custom Dashboard Portal serving visualizations straight from the Gold layer.',
        'Replaced individual Power BI licenses with portal-based access.',
        'Standardized governance and quality to ensure trust in the numbers.',
      ],
    },
    results: {
      pt: [
        'Custo por usuário caiu de R$ 45 para R$ 5 (redução de ~9x).',
        'Portal estendido para mais de 500 clientes da empresa.',
        'O que era custo virou um produto de dados gerador de receita.',
      ],
      en: [
        'Cost per user dropped from R$45 to R$5 (~9x reduction).',
        'Portal extended to 500+ company clients.',
        'What used to be a cost became a revenue-generating data product.',
      ],
    },
    stack: ['Databricks', 'Delta Lake', 'Power BI', 'SQL', 'Python'],
    mermaid: {
      pt: `flowchart LR
  S[Fontes de dados] --> B[Bronze]
  B --> SV[Silver]
  SV --> G[Gold]
  G --> P[Portal de Dashboards]
  P --> C[500+ clientes]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class S,B,SV a
  class G,P,C g`,
      en: `flowchart LR
  S[Data sources] --> B[Bronze]
  B --> SV[Silver]
  SV --> G[Gold]
  G --> P[Dashboard Portal]
  P --> C[500+ clients]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class S,B,SV a
  class G,P,C g`,
    },
  },
  {
    slug: 'genero-ia',
    projectTitle: {
      pt: 'Classificação de gênero com IA em base legada',
      en: 'AI gender classification on a legacy database',
    },
    company: 'Piwi',
    period: '2023',
    summary: {
      pt: 'Preenchimento automático de gênero em uma base legada com ~87% de assertividade usando Python.',
      en: 'Automatic gender backfill on a legacy database with ~87% accuracy using Python.',
    },
    problem: {
      pt: 'A tabela de caracterização de clientes não tinha o campo de gênero, informação que passou a ser importante no novo modelo de dados.',
      en: 'The customer profile table lacked a gender field, which became important in the new data model.',
    },
    solution: {
      pt: [
        'Extração dos nomes a partir da base legada.',
        'Uso da biblioteca gender_guesser.detector (Python) para inferir o gênero.',
        'Validação da assertividade a partir de um corpus de referência.',
        'Atualização da base com os valores inferidos.',
      ],
      en: [
        'Extracted names from the legacy database.',
        'Used the gender_guesser.detector library (Python) to infer gender.',
        'Validated accuracy against a reference corpus.',
        'Updated the database with the inferred values.',
      ],
    },
    results: {
      pt: [
        'Preenchimento com assertividade de aproximadamente 87%.',
        'Campo de gênero disponível para o novo modelo de dados.',
        'Solução simples e de baixo custo para um gap de dados.',
      ],
      en: [
        'Backfill with roughly 87% accuracy.',
        'Gender field available for the new data model.',
        'Simple, low-cost solution for a data gap.',
      ],
    },
    stack: ['Python', 'gender_guesser', 'SQL'],
    mermaid: {
      pt: `flowchart LR
  DB[(Base legada)] --> EXT[Extracao de nomes]
  EXT --> ML[gender_guesser.detector]
  ML --> CLS[Classificacao ~87%]
  CLS --> UPD[Atualizacao da base]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class DB,EXT,ML a
  class CLS,UPD g`,
      en: `flowchart LR
  DB[(Legacy database)] --> EXT[Name extraction]
  EXT --> ML[gender_guesser.detector]
  ML --> CLS[Classification ~87%]
  CLS --> UPD[Database update]
  classDef a fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef g fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class DB,EXT,ML a
  class CLS,UPD g`,
    },
  },
];
