---
title: 'Liquid Clustering no Databricks: a evolução do OPTIMIZE + ZORDER no Delta Lake'
description: 'Se você trabalha com Delta Lake no Databricks há algum tempo, certamente já se deparou com o combo `OPTIMIZE` + `ZORDER BY` para organizar fisicamente…'
date: 2026-05-04
tags: ['Data Engineering', 'Databricks', 'Data Science']
canonical: 'https://medium.com/@arthurfr23/liquid-clustering-no-databricks-a-evolu%C3%A7%C3%A3o-do-optimize-zorder-no-delta-lake-e3632494b7bb'
---

Se você trabalha com Delta Lake no Databricks há algum tempo, certamente já se deparou com o combo `OPTIMIZE` + `ZORDER BY` para organizar fisicamente os dados nas suas tabelas. É uma abordagem que funciona, resolve problemas reais de performance e faz parte do dia a dia de quem lida com pipelines em larga escala. Mas como toda solução que nasce de um contexto específico, ela carrega limitações que ficam visíveis conforme o volume de dados cresce e os padrões de acesso se tornam mais complexos.

O Databricks introduziu o **Liquid Clustering** como a evolução direta dessa abordagem. Não é uma mudança cosmética, é uma reimaginação de como a organização física de dados deve funcionar em um ambiente de Data Lakehouse. E entender essa diferença, do ponto de vista técnico, faz diferença real no design das suas tabelas e pipelines.

Neste artigo vou cobrir o que muda: como o `OPTIMIZE` e o `ZORDER` funcionam internamente, onde eles falham, e como o Liquid Clustering resolve esses problemas com uma abordagem diferente. Vou também mostrar como implementar na prática com exemplos concretos.

## O que o OPTIMIZE realmente faz

O `OPTIMIZE` resolve um problema clássico de Data Lakes: o acúmulo de arquivos pequenos. Em um pipeline incremental típico, cada micro-batch ou job de ingestão escreve uma quantidade de arquivos no storage. Com o tempo, uma tabela que deveria ter 50 arquivos de 128MB acaba com 50.000 arquivos de 128KB. O impacto disso é direto no planejamento de queries: o Spark precisa abrir e ler metadados de cada arquivo individualmente, e isso cria overhead mesmo antes de processar uma linha de dado.

```sql
OPTIMIZE catalog.schema.table
```

Internamente, o `OPTIMIZE` lê os arquivos pequenos, os consolida em arquivos maiores (próximos do tamanho alvo, geralmente 128MB ou 256MB dependendo da configuração) e reescreve no storage. O Delta Log é atualizado para refletir a nova estrutura de arquivos. Os arquivos antigos não são deletados imediatamente, eles ficam marcados como removidos no log e são limpos posteriormente pelo `VACUUM`.

Sozinho, o `OPTIMIZE` não ordena os dados por nenhum critério específico. Ele apenas compacta. Para adicionar ordem física que beneficia queries filtradas por colunas específicas, você adiciona o `ZORDER BY`.

```sql
OPTIMIZE catalog.schema.table ZORDER BY (customer_id, event_date)
```

O Z-Ordering é um algoritmo de preenchimento de curva espacial multidimensional que co-localiza registros com valores similares nas colunas especificadas dentro dos mesmos arquivos Parquet. O efeito prático é que uma query com filtro em `customer_id` consegue pular arquivos inteiros via **data skipping**, porque o Delta Lake mantém estatísticas de min/max por arquivo. Se o arquivo contém apenas `customer_id` entre 1000 e 2000, e a query busca `customer_id = 5000`, o arquivo é ignorado completamente.

## Os limites do ZORDER

O `ZORDER` funciona bem em cenários simples. O problema aparece quando você começa a ter requisitos mais sofisticados.

**Problema 1: colunas de alta cardinalidade com distribuição desigual.**

Se você faz `ZORDER BY (customer_id)` e tem clientes com volumes de dados muito diferentes (alguns com 10 registros, outros com 10 milhões), o algoritmo não distribui de forma eficiente. A co-localização fica prejudicada exatamente nos clientes mais relevantes.

**Problema 2: múltiplas colunas competem entre si.**

O Z-Ordering tenta equilibrar a co-localização de todas as colunas listadas. Quanto mais colunas você adiciona, menos eficiente ele fica para cada uma individualmente. Na prática, com mais de 3–4 colunas, o benefício começa a diminuir significativamente.

**Problema 3: o processo é não-incremental.**

Toda vez que você roda `OPTIMIZE ZORDER BY`, ele precisa reescrever os arquivos para re-ordenar os dados. Não existe um mecanismo de aproveitamento do trabalho já feito. Em tabelas grandes, isso significa reescrever centenas de gigabytes ou terabytes regularmente, com custo de computação e tempo proporcional.

**Problema 4: mudança de colunas é traumática.**

Se você decidiu fazer `ZORDER BY (region)` e depois percebeu que o padrão de acesso mudou e `product_category` seria mais útil, você precisa rodar um `OPTIMIZE ZORDER BY (product_category)` completo na tabela inteira. Não tem como fazer isso de forma incremental.

## Como o Liquid Clustering funciona

O Liquid Clustering resolve esses problemas com uma arquitetura diferente. Em vez de usar Z-Ordering como algoritmo de ordenação física aplicado em batch, ele usa um sistema baseado em **Hilbert curves** (curvas de Hilbert) para organizar os dados e, mais importante, faz isso de forma **incremental e adaptativa**.

Você define as colunas de clustering na criação da tabela:

```sql
CREATE TABLE catalog.schema.table
USING DELTA
CLUSTER BY (customer_id, event_date)
AS SELECT * FROM source_table;
```

Ou adiciona clustering a uma tabela existente:

```sql
ALTER TABLE catalog.schema.table
CLUSTER BY (customer_id, event_date);
```

A partir daí, quando você roda `OPTIMIZE`, o Databricks aplica o clustering de forma incremental, priorizando apenas os arquivos que ainda não estão clustered ou que foram invalidados por novas escritas.

```sql
OPTIMIZE catalog.schema.table
```

Sim, o mesmo `OPTIMIZE` de sempre. Mas agora ele sabe que a tabela tem Liquid Clustering definido e age de acordo.

## Por que Hilbert Curves em vez de Z-Order

Tanto Z-Ordering quanto Liquid Clustering são técnicas de preenchimento de curva espacial, mas as curvas de Hilbert têm uma propriedade matemática importante: elas preservam **localidade** de forma mais eficiente. Pontos que são próximos no espaço multidimensional ficam mais próximos na curva de Hilbert do que na curva Z. Para workloads com filtros em múltiplas colunas simultaneamente, o data skipping fica mais efetivo.

## Clustering incremental na prática

A diferença mais impactante no dia a dia é o comportamento incremental. O Delta Lake rastreia quais arquivos já foram processados pelo clustering engine. Quando novos dados chegam (via INSERT, MERGE, ou qualquer operação de escrita), apenas os arquivos novos ou afetados precisam ser reorganizados no próximo `OPTIMIZE`. Tabelas que já estão bem clustered passam pelo `OPTIMIZE` muito mais rápido.

## Exemplo prático: criando e monitorando uma tabela com Liquid Clustering

Vamos criar uma tabela de eventos com Liquid Clustering definido em duas colunas comuns em análises de comportamento de usuário:

```sql
spark.sql("""
    CREATE TABLE IF NOT EXISTS catalog.schema.user_events
    (
        event_id      BIGINT,
        customer_id   BIGINT,
        event_date    DATE,
        event_type    STRING,
        product_id    BIGINT,
        session_id    STRING,
        amount        DOUBLE,
        created_at    TIMESTAMP
    )
    USING DELTA
    CLUSTER BY (customer_id, event_date)
""")

# Inserindo dados e rodando o OPTIMIZE
spark.sql("""
    INSERT INTO catalog.schema.user_events
    SELECT * FROM catalog.staging.user_events_landing
    WHERE processed_date = current_date()
""")

# O OPTIMIZE agora aplica clustering incremental
spark.sql("OPTIMIZE catalog.schema.user_events")
```

Para verificar se o clustering está sendo aplicado e qual o estado atual da tabela:

```sql
-- Verifica as propriedades de clustering da tabela
DESCRIBE DETAIL catalog.schema.user_events;
```

```python
# Verificando o nível de clustering dos arquivos
# A coluna clusteringScore indica o quão bem clustered está cada arquivo
spark.sql("""
    SELECT
        file_path,
        file_size_bytes / 1024 / 1024 AS size_mb,
        clustering_quality
    FROM (
        DESCRIBE HISTORY catalog.schema.user_events
    )
    LIMIT 10
""")
```

Você também pode inspecionar o estado de clustering usando a função nativa:

```sql
SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'user_events';
```

Ou via Python com a API do Delta:

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forName(spark, "catalog.schema.user_events")

# Detalhes da tabela, incluindo clusteringColumns
detail = delta_table.detail()
detail.select("clusteringColumns", "numFiles", "sizeInBytes").show()
```

## Mudando colunas de clustering sem dor

Uma das vantagens mais práticas. Se os padrões de acesso mudaram e você precisa trocar as colunas de clustering, basta um `ALTER TABLE`:

```sql
-- Antes: clustering por customer_id e event_date
-- Depois: adiciona product_id como coluna de clustering
ALTER TABLE catalog.schema.user_events
CLUSTER BY (customer_id, event_date, product_id);
```

O próximo `OPTIMIZE` vai aplicar o novo clustering de forma incremental. Não precisa reescrever a tabela inteira de uma vez. O sistema vai gradualmente reorganizar os arquivos conforme eles são processados.

## Quando NÃO usar Liquid Clustering

Liquid Clustering não é bala de prata. Alguns cenários onde a abordagem antiga ainda faz sentido:

- **Tabelas pequenas (menos de alguns GB):** o overhead de gerenciamento não compensa. Partition + OPTIMIZE simples resolve.

- **Tabelas com padrões de acesso 100% previsíveis por uma única coluna de baixa cardinalidade:** particionamento por data ainda é muito eficiente e mais direto.

- **Ambientes que não rodam Databricks Runtime 13.3 LTS ou superior:** Liquid Clustering requer versão específica do runtime.

## Conclusão

O `OPTIMIZE` + `ZORDER BY` foi uma solução boa para um problema real, mas nasceu com limitações estruturais: processo de reorganização não-incremental, degradação de performance com múltiplas colunas, e custo alto para mudanças de estratégia. O Liquid Clustering resolve esses três pontos com uma abordagem mais madura.

Na prática, o que muda no seu trabalho é:

```
1. Você define clustering na criação da tabela (ou via `ALTER TABLE`), não no momento do `OPTIMIZE`.
2. O `OPTIMIZE` passa a ser uma operação incremental, mais rápida em tabelas que já estão bem organizadas.
3. Mudar a estratégia de clustering não implica reescrever tudo de uma vez.
4. Tabelas com múltiplas colunas de filtro se beneficiam mais, porque as curvas de Hilbert preservam localidade melhor que Z-Ordering.
```

A limitação honesta que vale mencionar: Liquid Clustering está em evolução. Algumas integrações com ferramentas de terceiros que leem Delta Lake diretamente ainda não aproveitam o clustering da forma ideal. E, como qualquer feature relativamente nova, é prudente testar em ambiente não-produtivo antes de migrar tabelas críticas.

Se você ainda está usando `ZORDER BY` em tabelas com mais de 100GB e acesso por múltiplas colunas, vale dedicar algumas horas para avaliar Liquid Clustering. O custo de migração é baixo e o ganho em latência de queries e tempo de `OPTIMIZE` costuma ser relevante o suficiente para justificar.
