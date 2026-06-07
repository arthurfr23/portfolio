import type { CaseStudy } from './types';

export const caseStudies: CaseStudy[] = [
  {
    slug: 'portal-dashboards',
    projectTitle: {
      pt: 'Portal de Dashboards como produto de dados',
      en: 'Dashboard Portal as a data product',
    },
    company: 'Paytime',
    period: '2024',
    summary: {
      pt: 'Como um portal de dashboards reduziu o custo de BI em 9x e virou um produto para 500+ clientes.',
      en: 'How a dashboard portal cut BI cost by 9x and became a product for 500+ clients.',
    },
    problem: {
      pt: 'O custo de licenças de Power BI (R$ 45 por usuário) inviabilizava escalar BI para todos os clientes da fintech. Cada novo cliente que precisava de relatórios aumentava o custo de forma linear, limitando o alcance da plataforma.',
      en: 'Power BI license cost (R$45 per user) made it unfeasible to scale BI to all of the fintech\'s clients. Every new client needing reports increased cost linearly, limiting the platform\'s reach.',
    },
    solution: {
      pt: [
        'Projetei um Lakehouse no Databricks como camada única de dados confiáveis (Bronze→Silver→Gold).',
        'Construí um Portal de Dashboards próprio servindo as visualizações direto da camada Gold.',
        'Substituí as licenças individuais de Power BI por um modelo de acesso via portal.',
        'Padronizei governança e qualidade de dados para garantir confiança nos números.',
      ],
      en: [
        'Designed a Databricks Lakehouse as a single trusted data layer (Bronze→Silver→Gold).',
        'Built a custom Dashboard Portal serving visualizations straight from the Gold layer.',
        'Replaced individual Power BI licenses with portal-based access.',
        'Standardized governance and data quality to ensure trust in the numbers.',
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
    mermaid: `flowchart LR
  S[Fontes de dados] --> B[Bronze]
  B --> SV[Silver]
  SV --> G[Gold]
  G --> P[Portal de Dashboards]
  P --> C[500+ clientes]
  classDef accent fill:#0d1525,stroke:#3b82f6,color:#e2e8f0
  classDef gold fill:#0d1525,stroke:#10b981,color:#e2e8f0
  class S,B,SV accent
  class G,P,C gold`,
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
      pt: 'A plataforma de dados dependia de um framework altamente complexo que dificultava a manutenção e impedia a entrega de dados dentro do SLA crítico de 15 minutos exigido pelo negócio.',
      en: 'The data platform relied on a highly complex framework that made maintenance hard and prevented data delivery within the business-critical 15-minute SLA.',
    },
    solution: {
      pt: [
        'Redesenhei o framework por completo, simplificando a arquitetura e a manutenção.',
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
    mermaid: `flowchart TB
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
  },
];
