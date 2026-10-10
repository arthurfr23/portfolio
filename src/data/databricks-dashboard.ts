import type { Locale } from '../config/site';

export const CERT_LABELS: Record<string, string> = {
  de_assoc: 'Data Engineer Associate',
  de_pro: 'Data Engineer Professional',
  da_assoc: 'Data Analyst Associate',
  genai_assoc: 'Generative AI Engineer Associate',
  spark: 'Apache Spark Developer',
  ml_assoc: 'Machine Learning Associate',
  ml_pro: 'Machine Learning Professional',
};

export const PRO_CERTS = ['de_pro', 'ml_pro'];

export interface DashboardCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  teaser: string;
  cta: string;
  snapshot: string;
  kpi: { people: string; certs: string; avg: string; pro: string; companies: string };
  filters: {
    search: string;
    cert: string;
    family: string;
    seniority: string;
    min: string;
    all: string;
    reset: string;
    results: string;
    resultsOne: string;
  };
  charts: {
    byCert: string;
    byCertNote: string;
    dist: string;
    distAxis: string;
    companies: string;
    companiesNote: string;
    family: string;
    people: string;
    certs: string;
  };
  table: {
    title: string;
    name: string;
    role: string;
    company: string;
    certs: string;
    credentials: string;
    profile: string;
    prev: string;
    next: string;
    page: string;
    empty: string;
    };
  method: { title: string; items: string[]; optout: string; contact: string };
  family: Record<string, string>;
  seniority: Record<string, string>;
}

export const dashboardCopy: Record<Locale, DashboardCopy> = {
  pt: {
    eyebrow: 'Comunidade Databricks',
    title: 'Certificações Databricks no Brasil',
    subtitle:
      'Quem são, onde trabalham e quais certificações têm os profissionais certificados em Databricks no Brasil — para quem trabalha com a plataforma e para quem contrata.',
    teaser:
      'Um raio-x dos profissionais certificados em Databricks no Brasil: certificações mais comuns, empresas com mais certificados e o ranking completo.',
    cta: 'Explorar o dashboard',
    snapshot: 'Dados de {date}',
    kpi: {
      people: 'Profissionais certificados',
      certs: 'Certificações',
      avg: 'Média por profissional',
      pro: 'Com certificação Professional',
      companies: 'Empresas',
    },
    filters: {
      search: 'Buscar nome, cargo ou empresa',
      cert: 'Certificação',
      family: 'Área',
      seniority: 'Senioridade',
      min: 'Mínimo de certificações',
      all: 'Todas',
      reset: 'Limpar filtros',
      results: '{n} profissionais',
      resultsOne: '{n} profissional',
    },
    charts: {
      byCert: 'Profissionais por certificação',
      byCertNote: 'Versões do Spark Developer somadas',
      dist: 'Quantas certificações cada profissional tem',
      distAxis: 'certificações',
      companies: 'Empresas com mais profissionais certificados',
      companiesNote: 'Top 12',
      family: 'Área de atuação',
      people: 'profissionais',
      certs: 'certificações',
    },
    table: {
      title: 'Ranking',
      name: 'Nome',
      role: 'Cargo',
      company: 'Empresa',
      certs: 'Certificações',
      credentials: 'Credenciais',
      profile: 'Ver perfil no diretório oficial',
      prev: 'Anterior',
      next: 'Próxima',
      page: 'Página {p} de {n}',
      empty: 'Nenhum profissional encontrado com esses filtros.',
      me: 'eu',
    },
    method: {
      title: 'Metodologia',
      items: [
        'Fonte: Databricks Certified Directory, diretório público em que cada profissional opta por aparecer. Inclui apenas perfis que informam o Brasil como país.',
        'O ranking ordena pelo número de credenciais listadas no diretório; empates dividem a mesma posição.',
        'Área e senioridade são inferidas do cargo informado no perfil (em PT, EN e ES) e servem como aproximação.',
        'Perfis sem nome ou sem certificações foram desconsiderados.',
      ],
      optout: 'Seu perfil aparece aqui e você quer corrigir ou remover? Atualize seus dados no diretório oficial ou',
      contact: 'fale comigo',
    },
    family: {
      data_eng: 'Engenharia de Dados',
      ai_ml: 'IA, ML e Data Science',
      architecture: 'Arquitetura e Soluções',
      analyst_bi: 'Análise de Dados e BI',
      management: 'Gestão e Liderança',
      analytics_eng: 'Analytics Engineering',
      consulting: 'Consultoria',
      software: 'Engenharia de Software',
      other: 'Outros',
      unknown: 'Não informado',
    },
    seniority: {
      junior: 'Júnior',
      mid: 'Pleno',
      senior: 'Sênior',
      lead: 'Lead / Especialista',
      management: 'Gestão',
      unspecified: 'Não especificada',
      unknown: 'Não informado',
    },
  },
  en: {
    eyebrow: 'Databricks community',
    title: 'Databricks Certifications in Brazil',
    subtitle:
      'Who they are, where they work and which certifications Databricks-certified professionals in Brazil hold — for people who work with the platform and for people who hire.',
    teaser:
      'An X-ray of Databricks-certified professionals in Brazil: the most common certifications, the companies with the most certified people and the full ranking.',
    cta: 'Explore the dashboard',
    snapshot: 'Data as of {date}',
    kpi: {
      people: 'Certified professionals',
      certs: 'Certifications held',
      avg: 'Average per professional',
      pro: 'With a Professional-level cert',
      companies: 'Companies',
    },
    filters: {
      search: 'Search name, role or company',
      cert: 'Certification',
      family: 'Role area',
      seniority: 'Seniority',
      min: 'Minimum certifications',
      all: 'All',
      reset: 'Clear filters',
      results: '{n} professionals',
      resultsOne: '{n} professional',
    },
    charts: {
      byCert: 'Professionals per certification',
      byCertNote: 'Spark Developer versions combined',
      dist: 'How many certifications each professional holds',
      distAxis: 'certifications',
      companies: 'Companies with the most certified professionals',
      companiesNote: 'Top 12',
      family: 'Role area',
      people: 'professionals',
      certs: 'certifications',
    },
    table: {
      title: 'Ranking',
      name: 'Name',
      role: 'Role',
      company: 'Company',
      certs: 'Certifications',
      credentials: 'Credentials',
      profile: 'View profile on the official directory',
      prev: 'Previous',
      next: 'Next',
      page: 'Page {p} of {n}',
      empty: 'No professionals match these filters.',
      me: 'me',
    },
    method: {
      title: 'Methodology',
      items: [
        'Source: the Databricks Certified Directory, a public directory each professional opts into. Only profiles that list Brazil as their country are included.',
        'The ranking orders by the number of credentials listed in the directory; ties share the same position.',
        'Role area and seniority are inferred from the job title on each profile (in PT, EN and ES) and are an approximation.',
        'Profiles without a name or without certifications were left out.',
      ],
      optout: 'Is your profile here and you want to fix or remove it? Update your data on the official directory or',
      contact: 'get in touch',
    },
    family: {
      data_eng: 'Data Engineering',
      ai_ml: 'AI, ML & Data Science',
      architecture: 'Architecture & Solutions',
      analyst_bi: 'Data Analysis & BI',
      management: 'Management & Leadership',
      analytics_eng: 'Analytics Engineering',
      consulting: 'Consulting',
      software: 'Software Engineering',
      other: 'Other',
      unknown: 'Not informed',
    },
    seniority: {
      junior: 'Junior',
      mid: 'Mid-level',
      senior: 'Senior',
      lead: 'Lead / Specialist',
      management: 'Management',
      unspecified: 'Not specified',
      unknown: 'Not informed',
    },
  },
};
