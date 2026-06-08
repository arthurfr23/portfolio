---
title: 'AI/BI Dashboards e DABs: a lição que aprendi quase da pior forma'
description: 'Tem um comportamento no Databricks que parece bug mas é feature, e que quase ninguém descobre até perder um dashboard em produção.'
date: 2026-05-05
tags: ['Data Engineering', 'Databricks']
canonical: 'https://medium.com/@arthurfr23/ai-bi-dashboards-e-dabs-a-li%C3%A7%C3%A3o-que-aprendi-quase-da-pior-forma-b78acfb07f13'
---

Tem um comportamento no Databricks que parece bug mas é feature, e que quase ninguém descobre até perder um dashboard em produção.

Essa semana um engenheiro postou no Reddit descrevendo exatamente essa situação: dashboards do AI/BI deployados para clientes, checados no Git, aparentemente sob controle. Ao mudar de branch para trabalhar em outra feature, os dashboards sumiram do workspace. Antes de existir um plano de recuperação, os dashboards estavam inacessíveis para clientes.

O motivo é o modelo de vínculo entre Git e workspace no Databricks. E a solução, que pode parecer trabalhosa à primeira vista, é a correta para qualquer recurso que vai para produção: deploy via Databricks Asset Bundles.

## Como o Git sync funciona no Databricks

Quando você faz checkout de um arquivo no Git do Databricks, incluindo dashboards `.lvdash.json`, o arquivo fica vinculado ao branch ativo. Isso significa que o workspace exibe o recurso enquanto esse branch está ativo no contexto do workspace.

O comportamento se torna problemático quando você troca de branch:

```bash
Branch: feature/novo-dashboard
-> dashboard aparece no workspace
-> clientes acessam
git checkout feature/outra-feature
-> o Databricks Git sync atualiza o workspace
-> dashboard some porque não existe nesse branch
-> clientes sem acesso
```

Isso não é um bug de implementação. O modelo do Databricks é explícito: o Git é a fonte de verdade, e o workspace reflete o estado do branch. O problema é que esse modelo funciona bem para notebooks em desenvolvimento e mal para recursos compartilhados com usuários que não conhecem a diferença entre branches.

A documentação menciona esse comportamento, mas é o tipo de coisa que ninguém lê antes de precisar.

## A solução: dashboards como recursos declarativos no DABs

Databricks Asset Bundles trata recursos como código declarativo gerenciado independentemente do branch ativo no workspace. Um dashboard no DABs é criado e mantido no workspace quando você faz `bundle deploy`, e permanece lá até ser explicitamente removido via `bundle destroy`.

Isso é a diferença fundamental:

```
Git sync: workspace = estado do branch atual
DABs: workspace = estado do último deploy
```

Para um recurso de produção que clientes acessam, o modelo do DABs é o correto.

## Configuração de dashboard no bundle

A estrutura do bundle para incluir um dashboard:

```yaml
# databricks.yml
bundle:
  name: analytics-platform

targets:
  dev:
    workspace:
      host: https://adb-xxx.azuredatabricks.net
  prod:
    workspace:
      host: https://adb-yyy.azuredatabricks.net

resources:
  dashboards:
    sales_overview:
      display_name: "Sales Overview"
      file_path: ./dashboards/sales_overview.lvdash.json
      embed_credentials: false
      warehouse_id: ${var.warehouse_id}

    revenue_by_region:
      display_name: "Revenue by Region"
      file_path: ./dashboards/revenue_by_region.lvdash.json
      embed_credentials: false
      warehouse_id: ${var.warehouse_id}
```

O arquivo `.lvdash.json` é o formato do AI/BI Dashboard exportado. Você exporta do workspace, versiona no Git como qualquer outro arquivo, e o DABs cuida do deploy.

## Fluxo de trabalho com DABs

Com o dashboard no bundle, o fluxo de desenvolvimento muda:

```bash
# Desenvolver no workspace normalmente
# Quando satisfeito, exportar o dashboard
databricks dashboards export <dashboard-id> --output ./dashboards/

# Versionar no Git
git add dashboards/sales_overview.lvdash.json
git commit -m "update sales overview: add cohort chart"

# Deploy para staging
databricks bundle deploy --target dev

# Validar no ambiente dev
# PR review, merge para main

# Deploy para produção
databricks bundle deploy --target prod
```

A partir do primeiro `bundle deploy`, o dashboard existe no workspace de forma independente do branch. Você pode fazer checkout de qualquer branch no seu ambiente local sem afetar o que está deployado.

O rollback também fica simples: você volta para um commit anterior e faz deploy novamente.

```bash
git checkout <commit-anterior>
databricks bundle deploy --target prod
```

## Permissões de dashboard no bundle

Um ponto que não é óbvio: você também pode declarar permissões do dashboard no bundle, garantindo que clientes e times certos tenham acesso sem configuração manual no workspace:

```yaml
resources:
  dashboards:
    sales_overview:
      display_name: "Sales Overview"
      file_path: ./dashboards/sales_overview.lvdash.json
      warehouse_id: ${var.warehouse_id}
      permissions:
        - level: CAN_VIEW
          group_name: external-clients
        - level: CAN_EDIT
          group_name: data-team
        - level: IS_OWNER
          user_name: arthur@empresa.com
```

Isso garante que um novo deploy não reseta permissões configuradas manualmente no workspace, o que é outra fonte comum de problema em ambientes com múltiplos times.

## O que aprender com esse tipo de incidente

O problema dos dashboards que somem é um exemplo de uma classe maior de problemas: comportamentos de plataforma que fazem sentido dentro de um modelo mental específico (Git como fonte de verdade) mas surpreendem quem não conhece esse modelo.

Alguns princípios que esse caso ilustra:

**Qualquer recurso de produção acessado por usuários deve ser gerenciado como infraestrutura, não como arquivo de trabalho.**

Um notebook de desenvolvimento pode viver no Git sync sem problema. Um dashboard que clientes acessam precisa de deploy controlado.

**DABs é o mecanismo correto para isso.**

Não porque é mais moderno, mas porque o modelo de deploy explícito é mais seguro para recursos compartilhados do que o modelo de sync implícito do Git.

**Testar o deploy em staging antes de produção previne essa classe de problema.**

Se o fluxo inclui `bundle deploy --target dev` antes de produção, você vê o dashboard aparecer e desaparecer de forma controlada antes de afetar cliente real.

## Conclusão

O comportamento dos dashboards vinculados a branch não é um bug do Databricks. É uma consequência do modelo de Git sync que faz sentido para desenvolvimento mas não para recursos de produção compartilhados.

A solução não é evitar o Git sync, é separar claramente o que é recurso de desenvolvimento e o que é recurso de produção. Desenvolvimento vive no Git sync. Produção vive no bundle.

Quem está começando com AI/BI Dashboards: configure o bundle desde o primeiro dashboard que vai para cliente. O custo de configurar o DABs cedo é baixo. O custo de migrar depois de um incidente como esse é bem mais alto, não só tecnicamente, mas na confiança de quem estava usando o dashboard.
