// Contrato de dados do dashboard de analytics (Fase 4).
// A implementação (fetch da Stats API do provider escolhido — Umami/Plausible)
// será adicionada como ilha React consumindo exatamente este formato, sem
// alterar os componentes de seção.

export interface AnalyticsSummary {
  pageviews: number;
  visitors: number;
  topPages: { path: string; views: number }[];
  byCountry: { country: string; visitors: number }[];
  range: { from: string; to: string };
}
