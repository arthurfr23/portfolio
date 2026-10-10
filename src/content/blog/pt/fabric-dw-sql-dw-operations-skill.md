---
title: 'Diagnosticando o Fabric Data Warehouse com o SQL DW Operations Skill: investigando workloads sem sair do Copilot'
description: 'Quando um warehouse começa a dar sinais de lentidão, a investigação raramente começa com respostas claras. Ela começa com perguntas…'
date: 2026-09-17
tags: ['Microsoft Fabric', 'AI', 'Data Engineering', 'Azure']
canonical: 'https://medium.com/@arthurfr23/diagnosing-fabric-data-warehouse-with-the-sql-dw-operations-skill-investigating-workloads-without-e4060fe8661e'
---

Quando um warehouse começa a dar sinais de lentidão, a investigação raramente começa com respostas claras. Ela começa com perguntas. Houve um pico de capacidade? Alguma query específica ficou cara de repente? As requisições estão falhando, sendo canceladas ou simplesmente demorando mais do que o esperado? Responder essas perguntas no Microsoft Fabric, até pouco tempo atrás, exigia bastante trabalho manual: abrir o app Fabric Capacity Metrics, cruzar com o Query Insights, consultar as DMVs do SQL pool e ainda tentar correlacionar janelas de tempo entre ferramentas que não conversam diretamente entre si.

Esse fluxo de diagnóstico fragmentado é um dos maiores drenos de produtividade para quem opera Data Warehouses no Fabric. Você perde tempo não porque o problema é difícil, mas porque os dados estão espalhados. E quando finalmente chega à causa raiz, gastou mais energia navegando entre interfaces do que analisando o problema de fato.

O SQL DW Operations skill, agora GA (Generally Available), foi pensado para resolver exatamente essa lacuna. Ele traz a capacidade de investigar workloads do Fabric Data Warehouse diretamente pelo Copilot, consolidando as principais fontes de diagnóstico em uma interface conversacional. Neste artigo, vou detalhar o que esse skill faz, como ele funciona por baixo dos panos, quais são as limitações reais e quando ele de fato agrega valor no dia a dia de quem opera ambientes Fabric.

## O que é o SQL DW Operations skill e como ele funciona

O SQL DW Operations skill é uma capacidade adicionada ao Copilot no Microsoft Fabric que permite investigar o comportamento operacional de um Fabric Data Warehouse usando linguagem natural. Ele está disponível como um skill dentro do agente Copilot do Fabric, ou seja, não é um produto isolado, mas uma extensão da camada de agentes de IA que a Microsoft vem construindo sobre o Fabric.

Por baixo dos panos, o skill acessa dados de três fontes principais:

  - **Query Insights**: views de gerenciamento sobre execuções de queries, incluindo histórico, latência, frequência e status de execução.
  - **Fabric Capacity Metrics**: dados de consumo de CU (Capacity Unit), throttling e utilização ao longo do tempo.
  - **DMVs do SQL pool**: dynamic management views que expõem o estado atual de sessões, queries ativas, waits e locks.

A ideia é que, em vez de navegar manualmente por essas fontes, você simplesmente faça uma pergunta como "quais foram as queries mais lentas nas últimas 2 horas?" ou "houve throttling no warehouse entre 14h e 15h hoje?" e o skill correlaciona as fontes, gera a resposta e, quando relevante, mostra o SQL executado para chegar nela — o que importa para auditabilidade.

## Tipos de perguntas que o skill consegue responder

Com base na documentação e nos exemplos compartilhados no blog oficial da Microsoft, o SQL DW Operations skill cobre bem os seguintes cenários:

**1. Diagnóstico de queries lentas** Você pode perguntar sobre queries que ultrapassaram um limite de tempo, identificar se houve regressão de performance em queries específicas e ver o plano de execução de queries históricas via Query Insights.

**2. Análise de falhas e cancelamentos** O skill consegue filtrar execuções com status de erro ou cancelamento dentro de uma janela de tempo, o que é útil para correlacionar falhas com eventos de capacidade ou mudanças de carga.

**3. Consumo de capacidade** Perguntas sobre picos de consumo de CU, períodos de throttling e distribuição de carga ao longo do dia são respondidas cruzando dados do Capacity Metrics com o histórico de execução.

**4. Estado atual do warehouse** Para diagnóstico em tempo real, o skill consegue consultar sessões ativas, queries em execução e waits — algo que antes exigia conexão direta ao warehouse e execução manual das DMVs.

## Comparação com a abordagem tradicional

Para entender o valor real do skill, vale comparar diretamente com o fluxo anterior de diagnóstico.

### Abordagem anterior (sem o skill)

```sql
-- Passo 1: Conectar ao warehouse e verificar queries ativas
SELECT
session_id,
request_id,
start_time,
status,
command,
total_elapsed_time
FROM sys.dm_exec_requests
WHERE status NOT IN ('background', 'sleeping')
ORDER BY total_elapsed_time DESC;

-- Passo 2: Cruzar com o Query Insights para o histórico
SELECT
query_hash,
query_text,
start_time,
end_time,
status,
total_elapsed_time_ms
FROM queryinsights.exec_requests_history
WHERE start_time >= DATEADD(HOUR, -2, GETUTCDATE())
ORDER BY total_elapsed_time_ms DESC;

-- Passo 3: Abrir o app Capacity Metrics separadamente
-- e correlacionar manualmente os timestamps com os eventos acima
```

Esse fluxo funciona, mas exige que você saiba exatamente onde olhar, tenha acesso direto ao warehouse e ainda faça a correlação temporal manualmente. Em ambientes com alta concorrência ou múltiplos warehouses, isso escala mal.

## Com o SQL DW Operations skill

Você escreve no Copilot:

> "Quais queries tiveram tempo de execução acima de 5 minutos nas últimas 3 horas? Houve correlação com picos de capacidade no mesmo período?"

O skill executa as queries necessárias, cruza com os dados de capacidade e retorna um resumo estruturado com as queries candidatas, os timestamps dos picos de CU e a correlação entre os dois. Ele também mostra o SQL executado, o que permite validar o resultado.

A diferença não é só de conveniência — é de velocidade de diagnóstico. Em incidentes ativos, cada minuto conta, e remover a fricção de navegar entre ferramentas tem impacto direto no MTTR (Mean Time to Resolve).

## Exemplo prático: investigando uma janela de degradação

Vamos simular um cenário real. Imagine que você recebeu uma reclamação às 16h de que o warehouse estava lento. Você abre o Copilot no Fabric e começa a investigação.

## Pergunta 1: Identificar o período exato da degradação

> "Entre 14h e 16h hoje, houve aumento significativo no tempo médio de execução das queries no warehouse?"

O skill consulta `queryinsights.exec_requests_history`, calcula a média de `total_elapsed_time_ms` por janela de 15 minutos e retorna algo como:

```
14:00–14:15: média 1.2s
14:15–14:30: média 1.4s
14:30–14:45: média 4.8s ← pico
14:45–15:00: média 6.1s ← pico
15:00–15:15: média 2.3s
15:15–16:00: média 1.1s
```

## Pergunta 2: Identificar as queries responsáveis

> "Quais queries estavam rodando durante o pico entre 14h30 e 15h? Mostre as mais lentas."

```sql
SELECT
query_hash,
LEFT(query_text, 200) AS query_preview,
start_time,
end_time,
total_elapsed_time_ms,
status
FROM queryinsights.exec_requests_history
WHERE start_time >= '2025-01-15 14:30:00'
AND start_time < '2025-01-15 15:00:00'
ORDER BY total_elapsed_time_ms DESC
LIMIT 10;
```

O resultado aponta, por exemplo, para uma query de agregação com full scan na tabela fato sendo executada 12 vezes no período — o que é incomum.

## Pergunta 3: Correlacionar com a capacidade

> "Houve throttling ou pico de consumo de CU nesse mesmo período?"

O skill cruza com o Capacity Metrics e confirma que o consumo de CU subiu para 95% da capacidade contratada entre 14h35 e 14h55, o que explica o aumento de latência nas outras queries concorrentes.

## Pergunta 4: Entender a causa raiz

> "Quem disparou essas queries? Existe algum padrão de usuário ou aplicação?"

```sql
SELECT
login_name,
COUNT(*) AS query_count,
AVG(total_elapsed_time_ms) AS avg_elapsed_ms
FROM queryinsights.exec_requests_history
WHERE query_hash = '<identified_hash>'
AND start_time >= '2025-01-15 14:30:00'
GROUP BY login_name
ORDER BY query_count DESC;
```

Resultado: um pipeline de ETL com bug de loop estava disparando a mesma query repetidamente sob um service principal específico.

Em um fluxo tradicional, essa investigação levaria de 20 a 40 minutos. Com o skill, você chega à causa raiz em menos de 5 minutos, sem sair do Copilot.

---

## Algumas limitações que permanecem

O SQL DW Operations skill é útil, mas não é mágica. Algumas limitações valem ser mencionadas para não criar expectativas erradas.

**1. Dependência do Query Insights estar habilitado**

O skill depende fortemente do Query Insights, que precisa estar habilitado no workspace. Se o histórico de queries não estiver sendo coletado, o skill perde boa parte da capacidade de diagnóstico histórico.

**2. Janela de retenção do histórico**

O Query Insights, por padrão, retém 30 dias de histórico. Investigar eventos mais antigos não é possível via skill sem exportação prévia dos dados.

**3. Sem capacidade de remediação automática**

O skill é puramente diagnóstico. Ele identifica o problema, mas não toma ações corretivas, como cancelar queries, ajustar workload groups ou redistribuir carga. A remediação continua manual.

**4. A qualidade da resposta depende da especificidade da pergunta**

Perguntas vagas geram respostas vagas. "O warehouse está lento?" não vai trazer o mesmo nível de detalhe que "quais queries com status de erro ocorreram nas últimas 2 horas, e qual código de erro estava associado a cada uma?". O skill rende mais nas mãos de quem já tem um modelo mental claro de diagnóstico e usa o Copilot para acelerar a execução — não para substituir o raciocínio.

**5. Disponibilidade por região e SKU**

Como qualquer funcionalidade do Copilot no Fabric, existe dependência de região e de SKU de capacidade. Verifique se a sua capacidade F-SKU está em uma região onde o Copilot está habilitado.

## Conclusão

O SQL DW Operations skill não reinventa o diagnóstico de Data Warehouse, mas remove um ponto de fricção real que qualquer pessoa que já investigou um incidente de performance no Fabric conhece bem: o custo de coordenar várias ferramentas ao mesmo tempo, sob pressão, tentando correlacionar dados manualmente.

O que ficou claro para mim analisando essa funcionalidade é que o maior ganho não está na sofisticação da IA em si, mas na consolidação do contexto. Ter as três fontes de diagnóstico — Query Insights, Capacity Metrics e DMVs — acessíveis por uma interface conversacional, com transparência sobre o SQL gerado, é uma mudança pragmática e bem executada.

Para times que operam ambientes Fabric com múltiplos warehouses e alta concorrência, o skill deveria entrar no runbook de incidentes como primeiro passo de triagem. Ele não substitui o conhecimento técnico de quem está investigando, mas acelera significativamente a chegada à causa raiz.

O próximo passo natural que eu esperaria da Microsoft seria adicionar capacidade de remediação assistida — sugerir cancelamento de queries, recomendar ajustes de isolamento de workload ou até criar alertas automáticos a partir de padrões detectados pelo skill. Mas, como ponto de partida em GA, o que foi entregue é sólido e ataca diretamente um problema real.
