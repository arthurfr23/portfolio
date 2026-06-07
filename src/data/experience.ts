import type { ExperienceItem } from './types';

export const experience: ExperienceItem[] = [
  {
    company: 'Power Tuning',
    role: { pt: 'Engenheiro de Dados', en: 'Data Engineer' },
    startDate: '2025-09',
    endDate: null,
    location: { pt: 'Brasil · Remoto', en: 'Brazil · Remote' },
    summary: {
      pt: 'Estratégia e modernização de plataformas de dados nacionais e internacionais com Microsoft Fabric e Databricks.',
      en: 'National and international data platform strategy and modernization with Microsoft Fabric and Databricks.',
    },
    highlights: {
      pt: [
        'Design e deploy de Data Platform para multinacional brasileira usando Microsoft Fabric e Databricks, alinhando soluções técnicas a objetivos de negócio e governança.',
        'Arquitetura e deploy de workflows de dados via Infrastructure as Code (IaC) com Azure Data Factory, garantindo pipelines escaláveis, mantíveis e auditáveis.',
        'Design e implementação de Lakehouse completo e produtos de IA usando Databricks e Azure.',
        'Implementação de Databricks Genie Spaces como interface de analytics conversacional sobre os dados da plataforma.',
      ],
      en: [
        'Designed and deployed a Data Platform for a major Brazilian multinational using Microsoft Fabric and Databricks, aligning technical solutions with business and governance objectives.',
        'Architected and deployed data workflows via Infrastructure as Code (IaC) through Azure Data Factory, ensuring scalable, maintainable and auditable pipelines.',
        'Designed and deployed an entire Lakehouse and AI products using Databricks and Azure.',
        'Implemented Databricks Genie Spaces as a conversational analytics interface over the platform data.',
      ],
    },
    stack: ['Microsoft Fabric', 'Databricks', 'Azure', 'Azure Data Factory', 'PySpark', 'SQL', 'Python'],
  },
  {
    company: 'Kumulus',
    role: { pt: 'Engenheiro de Dados', en: 'Data Engineer' },
    startDate: '2025-05',
    endDate: '2025-09',
    location: { pt: 'Brasil · Remoto', en: 'Brazil · Remote' },
    summary: {
      pt: 'Estratégia de dados, design de plataformas e implementação para clientes nacionais e internacionais.',
      en: 'Data strategy, platform design and implementation for national and international clients.',
    },
    highlights: {
      pt: [
        'Liderança de estratégia de plataforma de dados e design de arquitetura Lakehouse para multinacional americana, definindo padrões de governança, modelos de dados e estrutura alinhada aos objetivos do cliente.',
        'Contribuição à modernização de plataforma de dados para organização governamental dos EUA, mapeando maturidade de dados e conduzindo adoção junto a stakeholders internacionais.',
        'Design e implementação de soluções Lakehouse para duas empresas brasileiras, incluindo frameworks de governança e controles de qualidade de dados.',
        'Mentoria e supervisão de Engenheiros de Dados Júnior, contribuindo para a definição de topologia de equipe.',
        'Implantação de Microsoft Copilot para aumentar a produtividade das equipes de dados nos clientes.',
      ],
      en: [
        'Led data platform strategy and Lakehouse architecture design for a U.S.-based multinational, defining governance standards, data models and platform structure aligned with client goals.',
        'Contributed to data platform modernization for a U.S. government organization, mapping data maturity and driving adoption with international stakeholders.',
        'Designed and implemented Lakehouse solutions for two Brazilian companies, including governance frameworks and data quality controls.',
        'Mentored and supervised junior Data Engineers, contributing to team topology definition.',
        'Deployed Microsoft Copilot to increase data team productivity across clients.',
      ],
    },
    stack: ['Databricks', 'Azure', 'Python', 'SQL', 'Delta Lake'],
  },
  {
    company: 'Paytime',
    role: { pt: 'Engenheiro de Dados', en: 'Data Engineer' },
    startDate: '2024-04',
    endDate: '2025-05',
    location: { pt: 'Brasil · Remoto', en: 'Brazil · Remote' },
    summary: {
      pt: 'Responsável pela estratégia de dados end-to-end da empresa, do zero: infraestrutura, governança, qualidade e analytics.',
      en: 'Owned the company\'s end-to-end data strategy from the ground up: infrastructure, governance, quality and analytics.',
    },
    highlights: {
      pt: [
        'Design e implementação do Data Lakehouse (Databricks, Spark, SQL, MongoDB, AWS) como base para produtos de dados e analytics self-service.',
        'Estabelecimento de práticas de governança: pipelines de testes de qualidade, padrões de documentação e políticas de controle de acesso.',
        'Design e entrega dos primeiros produtos de dados da empresa: dashboards interativos em Power BI para stakeholders de negócio.',
        'Implementação de serviços de dados na AWS (S3, Lambda, Glue, IAM) para infraestrutura segura e escalável.',
        'Exploração e implementação de Databricks Genie Spaces para analytics conversacional sobre os dados da empresa.',
      ],
      en: [
        'Designed and implemented the Data Lakehouse (Databricks, Spark, SQL, MongoDB, AWS) as the foundation for scalable data products and self-service analytics.',
        'Established data governance practices including quality testing pipelines, documentation standards and access control policies.',
        'Designed and delivered the company\'s first data products: interactive Power BI dashboards for business stakeholders.',
        'Implemented AWS data services (S3, Lambda, Glue, IAM) for a secure and scalable data infrastructure.',
        'Explored and implemented Databricks Genie Spaces for conversational analytics over company data.',
      ],
    },
    stack: ['Databricks', 'Apache Spark', 'AWS', 'MongoDB', 'Power BI', 'Python', 'SQL'],
  },
  {
    company: 'Piwi',
    role: { pt: 'Analista de Dados', en: 'Data Analyst' },
    startDate: '2023-09',
    endDate: '2024-03',
    location: { pt: 'Brasil · Remoto', en: 'Brazil · Remote' },
    summary: {
      pt: 'Gestão da estratégia de dados end-to-end da empresa, da ingestão ao analytics.',
      en: 'Managed the company\'s end-to-end data strategy, from ingestion to analytics enablement.',
    },
    highlights: {
      pt: [
        'Liderança do desenvolvimento do Lakehouse da empresa no GCP, definindo a estratégia de arquitetura e gestão escalável de dados.',
        'Design e lançamento dos primeiros produtos de analytics com Looker Studio, habilitando BI self-service.',
        'Desenvolvimento de pipelines de extração e limpeza de dados em Python, SQL e MongoDB.',
      ],
      en: [
        'Led the development of the company\'s Lakehouse on GCP, defining the data architecture strategy and enabling scalable data management.',
        'Designed and launched the company\'s first analytics data products using Looker Studio, enabling self-service BI.',
        'Developed data extraction and cleaning pipelines using Python, SQL and MongoDB.',
      ],
    },
    stack: ['GCP', 'Python', 'SQL', 'MongoDB', 'Looker Studio'],
  },
  {
    company: 'Secretaria Estadual de Educação do ES',
    role: { pt: 'Analista de Dados', en: 'Data Analyst' },
    startDate: '2022-03',
    endDate: '2023-01',
    location: { pt: 'Espírito Santo · Brasil', en: 'Espírito Santo · Brazil' },
    summary: {
      pt: 'Suporte a decisões baseadas em dados para políticas educacionais públicas no Espírito Santo.',
      en: 'Supporting data-driven decision-making for public educational policy in Espírito Santo.',
    },
    highlights: {
      pt: [
        'Análise de dados e relatórios estratégicos sobre escolas indígenas, quilombolas e rurais para subsidiar decisões de política educacional.',
        'Produção de materiais educativos e condução de treinamentos sobre práticas de dados para equipes escolares.',
      ],
      en: [
        'Conducted data analysis and strategic reporting on Indigenous, Quilombola and Rural schools to inform educational policy decisions.',
        'Produced educational resources and led training sessions on data practices for school staff.',
      ],
    },
    stack: ['Power BI', 'Python', 'SQL', 'Excel'],
  },
  {
    company: 'UFES — Universidade Federal do Espírito Santo',
    role: { pt: 'Pesquisador / Analista de Dados', en: 'Researcher / Data Analyst' },
    startDate: '2018-03',
    endDate: '2022-11',
    location: { pt: 'Vitória, ES · Brasil', en: 'Vitória, ES · Brazil' },
    summary: {
      pt: 'Pesquisa de mestrado e doutorado com foco em análise histórica de dados e modelagem de redes sociais.',
      en: 'Master\'s and PhD research focused on historical data analysis and social network modeling.',
    },
    highlights: {
      pt: [
        'ETL em documentos históricos e construção de pipelines de dados com Python.',
        'Análise de redes sociais (Twitter) via integração com API usando Python.',
        'Visualizações e dashboards em Power BI para comunicar resultados a stakeholders acadêmicos.',
        'Desenvolvimento do site www.jornaisdaindependencia.com.br.',
      ],
      en: [
        'Performed ETL on historical documents and built data pipelines using Python.',
        'Conducted social network analysis (Twitter) through API integration using Python.',
        'Built visualizations and dashboards in Power BI to communicate research findings to academic stakeholders.',
        'Developed the website www.jornaisdaindependencia.com.br.',
      ],
    },
    stack: ['Python', 'R', 'Power BI', 'SQL', 'Excel'],
  },
];
