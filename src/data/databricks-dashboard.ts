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
  teaserTitle: string;
  subtitle: string;
  teaser: string;
  tabs: { label: string; br: string; intl: string; loading: string; error: string };
  cta: string;
  snapshot: string;
  picker: { label: string; placeholder: string; empty: string; me: string; other: string; certs: string };
  kpi: { people: string; certs: string; avg: string; pro: string; companies: string; countries: string };
  filters: {
    search: string;
    cert: string;
    family: string;
    seniority: string;
    continent: string;
    country: string;
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
    countries: string;
    continents: string;
    continentsNote: string;
    people: string;
    certs: string;
  };
  table: {
    title: string;
    name: string;
    role: string;
    company: string;
    country: string;
    countryRank: string;
    certs: string;
    credentials: string;
    profile: string;
    prev: string;
    next: string;
    page: string;
    empty: string;
    me: string;
  };
  method: { title: string; source: Record<'br' | 'intl', string[]>; items: string[]; optout: string; contact: string };
  family: Record<string, string>;
  continent: Record<string, string>;
  seniority: Record<string, string>;
}

export const dashboardCopy: Record<Locale, DashboardCopy> = {
  pt: {
    eyebrow: 'Comunidade Databricks',
    title: 'Ranking de certificações Databricks',
    teaserTitle: 'Certificações Databricks no Brasil',
    subtitle:
      'Quem são, onde trabalham e quais certificações têm os profissionais certificados em Databricks — no Brasil e no mundo. Para quem trabalha com a plataforma e para quem contrata.',
    teaser:
      'Um raio-x dos profissionais certificados em Databricks no Brasil: certificações mais comuns, empresas com mais certificados e o ranking completo.',
    cta: 'Explorar o dashboard',
    snapshot: 'Dados de {date}',
    tabs: {
      label: 'Abrangência do ranking',
      br: 'Brasil',
      intl: 'Internacional',
      loading: 'Carregando dados internacionais…',
      error: 'Não foi possível carregar os dados internacionais. Recarregue a página.',
    },
    picker: {
      label: 'Consultar posição no ranking',
      placeholder: 'Busque um profissional pelo nome',
      empty: 'Nenhum nome encontrado',
      me: 'Onde eu estou: #{rank} de {total} — entre os {n} profissionais com {c}+ certificações (top {p}%).',
      other: '{name}: #{rank} de {total} — entre os {n} profissionais com {c}+ certificações (top {p}%).',
      certs: '{c} cert.',
    },
    kpi: {
      people: 'Profissionais certificados',
      certs: 'Certificações',
      avg: 'Média por profissional',
      pro: 'Com certificação Professional',
      companies: 'Empresas',
      countries: 'Países',
    },
    filters: {
      search: 'Buscar nome, cargo ou empresa',
      cert: 'Certificação',
      family: 'Área',
      seniority: 'Senioridade',
      continent: 'Continente',
      country: 'País',
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
      countries: 'Países com mais profissionais certificados',
      continents: 'Profissionais por continente',
      continentsNote: 'Pelo país do perfil',
      people: 'profissionais',
      certs: 'certificações',
    },
    table: {
      title: 'Ranking',
      name: 'Nome',
      role: 'Cargo',
      company: 'Empresa',
      country: 'País',
      countryRank: 'Posição dentro do país',
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
      source: {
        br: [
          'Fonte: Databricks Certified Directory, diretório público em que cada profissional opta por aparecer. Inclui apenas perfis que informam o Brasil como país.',
        ],
        intl: [
          'Fonte: Databricks Certified Directory, diretório público em que cada profissional opta por aparecer. Inclui perfis de todos os países — é um export diferente do usado na aba Brasil, por isso os números do Brasil podem divergir.',
          'Boa parte dos perfis não informa país; eles entram no ranking geral e aparecem como "Não informado" nos filtros de país e continente.',
          'O continente é atribuído pelo país (América Central e Caribe contam como América do Norte; Oriente Médio como Ásia). Com um país selecionado, a coluna # mostra a posição dentro do país.',
        ],
      },
      items: [
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
    continent: {
      south_america: 'América do Sul',
      north_america: 'América do Norte',
      europe: 'Europa',
      asia: 'Ásia',
      africa: 'África',
      oceania: 'Oceania',
      unknown: 'Não informado',
    },
  },
  en: {
    eyebrow: 'Databricks community',
    title: 'Databricks Certifications Ranking',
    teaserTitle: 'Databricks Certifications in Brazil',
    subtitle:
      'Who they are, where they work and which certifications Databricks-certified professionals hold — in Brazil and worldwide. For people who work with the platform and for people who hire.',
    teaser:
      'An X-ray of Databricks-certified professionals in Brazil: the most common certifications, the companies with the most certified people and the full ranking.',
    cta: 'Explore the dashboard',
    snapshot: 'Data as of {date}',
    tabs: {
      label: 'Ranking scope',
      br: 'Brazil',
      intl: 'International',
      loading: 'Loading international data…',
      error: 'Could not load the international data. Please reload the page.',
    },
    picker: {
      label: 'Look up a position in the ranking',
      placeholder: 'Search a professional by name',
      empty: 'No name found',
      me: 'Where I stand: #{rank} of {total} — one of {n} professionals with {c}+ certifications (top {p}%).',
      other: '{name}: #{rank} of {total} — one of {n} professionals with {c}+ certifications (top {p}%).',
      certs: '{c} certs',
    },
    kpi: {
      people: 'Certified professionals',
      certs: 'Certifications held',
      avg: 'Average per professional',
      pro: 'With a Professional-level cert',
      companies: 'Companies',
      countries: 'Countries',
    },
    filters: {
      search: 'Search name, role or company',
      cert: 'Certification',
      family: 'Role area',
      seniority: 'Seniority',
      continent: 'Continent',
      country: 'Country',
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
      countries: 'Countries with the most certified professionals',
      continents: 'Professionals per continent',
      continentsNote: 'By profile country',
      people: 'professionals',
      certs: 'certifications',
    },
    table: {
      title: 'Ranking',
      name: 'Name',
      role: 'Role',
      company: 'Company',
      country: 'Country',
      countryRank: 'Position within the country',
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
      source: {
        br: [
          'Source: the Databricks Certified Directory, a public directory each professional opts into. Only profiles that list Brazil as their country are included.',
        ],
        intl: [
          'Source: the Databricks Certified Directory, a public directory each professional opts into. Profiles from every country are included — it is a different export from the one behind the Brazil tab, so the Brazil numbers may differ.',
          'Many profiles do not list a country; they are part of the overall ranking and show up as "Not informed" in the country and continent filters.',
          'The continent is derived from the country (Central America and the Caribbean count as North America; the Middle East as Asia). With a country selected, the # column shows the position within that country.',
        ],
      },
      items: [
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
    continent: {
      south_america: 'South America',
      north_america: 'North America',
      europe: 'Europe',
      asia: 'Asia',
      africa: 'Africa',
      oceania: 'Oceania',
      unknown: 'Not informed',
    },
  },
};
