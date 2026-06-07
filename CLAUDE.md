# CLAUDE.md — site_pessoal

Contexto para agentes que forem manter/atualizar este projeto.

## O que é

Site pessoal/portfólio de **Arthur Reis** — Engenheiro de Dados e IA.
Objetivos: apresentação para recrutadores, autodivulgação e base para um futuro MVP.

- **Stack:** Astro 6 (output estático) + TypeScript, CSS puro com design tokens, fontes self-host (`@fontsource`).
- **Hospedagem:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`), com rebuild diário (cron) para atualizar feeds.
- **URL:** https://arthurfr23.github.io/site_pessoal

## Decisões de design (travadas — manter)

- **Somente tema dark.** Não adicionar light mode sem pedido explícito.
- **Visual premium sóbrio:** animações discretas (scroll-reveal sutil, view transitions). Sem cursor custom, parallax pesado ou efeitos chamativos.
- **Bilíngue PT/EN** com `astro:i18n` (PT em `/`, EN em `/en/`). `LangToggle` troca o idioma preservando a página.
- Paleta: slate escuro (`--bg: #070c18`) + accents azul/ciano/esmeralda. Tokens em `src/styles/tokens.css`.

## Onde editar conteúdo (fonte única da verdade: `src/data/`)

| Arquivo | Conteúdo |
|---|---|
| `data/profile.ts` | nome, headline, bio, e-mail, anos de experiência |
| `data/experience.ts` | timeline de experiência |
| `data/skills.ts` | 4 categorias de skills |
| `data/certifications.ts` | certificações (+ badges em `public/images/badges/`) |
| `data/talks.ts` | palestras |
| `data/linkedin-projects.ts` | projetos (cada um pode ter `caseSlug`) |
| `data/case-studies.ts` | estudos de caso com diagrama Mermaid |
| `data/channels.ts` | handles de GitHub/YouTube/Medium/LinkedIn |
| `config/site.ts` | URL/base, flags, handle da newsletter |
| `i18n/ui.ts` | rótulos de UI (PT/EN) |

Todo texto visível é **bilíngue por campo** (`{ pt, en }`). Nunca hardcodar texto em componente.

## Blog (`src/content/blog/<lang>/<slug>.md`)

- Posts em `pt/` e `en/`. **Regra crítica de i18n:** o post PT e o EN devem usar o **mesmo nome de arquivo (slug)** — senão o seletor de idioma do post quebra (404). O `LangToggle` do post já cai na lista `/blog` se não houver tradução, mas o ideal é manter o mesmo slug.
- Frontmatter: `title, description, date, tags, cover?, canonical?, draft?`. Use `canonical` ao republicar do Medium.

## Integrações dinâmicas (build-time, resilientes)

`src/lib/{github,youtube,medium}.ts` buscam dados no build; se um feed falhar, caem no fallback `.cache/*.json` (versionado) — o build **nunca** quebra por causa de feed externo. YouTube filtra por `channels.youtube.featuredVideoIds`.

## Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # gera dist/ (valida tudo)
npm run preview  # serve o build
```

## Verificação ao alterar i18n/rotas

Após mudanças em rotas ou idiomas, rode `npm run build` e confirme que nenhum `LangToggle` aponta para 404 (todas as rotas existem em PT e EN). Páginas com slug traduzido devem usar o mesmo slug nos dois idiomas (vale para posts e case studies).

## Pendências / follow-ups

- **Newsletter:** criar conta no Buttondown e preencher `NEWSLETTER.buttondownHandle` em `config/site.ts` (a seção fica oculta enquanto vazio).
- **OG images:** a geração (`astro-og-canvas`) baixa a fonte de `api.fontsource.org` no build — para deixar 100% offline-safe, fornecer uma fonte `.ttf` local e configurar `fonts` em `src/pages/og/[...route].ts`.
- **Custom domain:** ajustar `SITE`/`BASE` em `config/site.ts` e adicionar `public/CNAME`.

## Segurança (repositório público)

- Nunca commitar `.env`, tokens ou credenciais. O token da API do GitHub vive em *Actions Secrets* (`GH_API_TOKEN`), nunca no código.
- O PDF do currículo em `public/cv/` é público — **não incluir endereço residencial ou telefone pessoal** nesse arquivo.
