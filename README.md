# site_pessoal

Portfólio pessoal de **Arthur Reis** — Engenheiro de Dados Sênior.
Bilíngue (PT/EN), dark premium, construído com **Astro** e publicado no **GitHub Pages**.

## Stack

- **Astro 6** (output estático), TypeScript
- CSS puro com design tokens · fontes self-host (`@fontsource`)
- Integrações em build-time: GitHub (API), YouTube (RSS), Medium (RSS) — com fallback resiliente em `.cache/`
- Deploy: GitHub Actions → GitHub Pages (rebuild diário p/ atualizar feeds)

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:4321/site_pessoal
npm run build      # gera dist/
npm run preview    # serve o build
```

Opcional: copie `.env.example` para `.env` e preencha `GH_API_TOKEN` (PAT fine-grained, leitura
pública) para elevar o rate limit da API do GitHub durante o build.

## O que preencher antes de publicar

Conteúdo central em [`src/data/`](src/data/) (procure pelos comentários `⚠️` / `TODO`):

- [`channels.ts`](src/data/channels.ts) — **YouTube channel_id** (`UC…`, não o @handle), **@username do Medium**, **URL do LinkedIn**.
- [`profile.ts`](src/data/profile.ts) — bio, localização, e-mail.
- [`experience.ts`](src/data/experience.ts) — **datas, cargos e conquistas reais** (atualmente placeholder).
- [`certifications.ts`](src/data/certifications.ts) — status, datas e URLs de verificação.
- [`talks.ts`](src/data/talks.ts) / [`projects.ts`](src/data/projects.ts) — ajustes finos.

Assets em `public/`:

- `public/images/profile.jpg` — foto profissional (e `public/images/og/default.png` para preview de links)
- `public/cv/arthur-reis-cv-pt.pdf` e `public/cv/arthur-reis-cv-en.pdf` — currículos

## Deploy (GitHub Pages)

1. Repositório **público** (Pages no plano Free exige repo público).
2. **Settings → Pages → Source = GitHub Actions**.
3. (Opcional) Secret `GH_API_TOKEN` para a API do GitHub.
4. Push na `main` → o workflow [`deploy.yml`](.github/workflows/deploy.yml) publica em
   `https://arthurfr23.github.io/site_pessoal`.

**Domínio próprio:** ajuste `SITE`/`BASE` em [`src/config/site.ts`](src/config/site.ts) (`BASE = '/'`)
e adicione `public/CNAME`.

## Estrutura

```
src/
├── config/site.ts     # SITE, BASE, locales, flags
├── data/              # conteúdo bilíngue (fonte da verdade)
├── i18n/              # dicionário + helpers
├── lib/               # integrações (github/youtube/medium) + cache resiliente
├── layouts/           # BaseLayout (SEO, fontes, hreflang)
├── components/        # base/ · layout/ · sections/ · cards/ · islands/ (dashboards futuros)
├── styles/            # tokens.css, global.css
└── pages/             # index, cv, 404 (+ en/)
```
