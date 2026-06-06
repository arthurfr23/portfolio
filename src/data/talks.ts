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
    url: '', // TODO: link do evento, se houver
    slidesUrl: '', // TODO: link dos slides/repo
  },
];
