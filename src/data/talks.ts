import type { Talk } from './types';

export const talks: Talk[] = [
  {
    title: {
      pt: 'Qualidade de Dados no Databricks',
      en: 'Data Quality on Databricks',
    },
    event: 'SQL Saturday #1139 Joinville',
    date: '2026-04-11',
    location: { pt: 'Joinville, SC · Brasil', en: 'Joinville, SC · Brazil' },
    description: {
      pt: 'Frameworks de qualidade de dados, contratos de dados, métricas e anti-patterns — ISO-25012 e DAMA DMBOK aplicados na arquitetura medallion.',
      en: 'Data quality frameworks, data contracts, metrics and anti-patterns — ISO-25012 and DAMA DMBOK applied to the medallion architecture.',
    },
    url: 'https://arthurfr23.github.io/sql_saturday_joinvile_2026_dq/',
    slidesUrl: '',
  },
  {
    title: {
      pt: 'Arquiteturas modernas de dados: Snowflake, Databricks e um pouco de IA',
      en: 'Modern data architectures: Snowflake, Databricks and a bit of AI',
    },
    event: 'SQL Saturday #1129 Vitória',
    date: '2025-12-06',
    location: { pt: 'Vitória, ES · Brasil', en: 'Vitória, ES · Brazil' },
    description: {
      pt: 'Comparativo entre arquiteturas modernas de dados — Snowflake e Databricks — e como a IA está transformando a forma de construir e operar plataformas de dados.',
      en: 'Comparison of modern data architectures — Snowflake and Databricks — and how AI is transforming the way data platforms are built and operated.',
    },
    url: 'https://sqlsaturday.com/2025-12-06-sqlsaturday1129/',
    slidesUrl: '',
  },
];
