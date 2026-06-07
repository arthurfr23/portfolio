---
title: 'Colunas VOID no Delta Lake'
description: 'Por que uma coluna sem tipo aparece no seu schema Delta, o que isso quebra e como resolver de forma idempotente.'
date: 2026-05-07
tags: ['Delta Lake', 'Databricks', 'Spark']
canonical: 'https://medium.com/@arthurfr23/colunas-void-no-delta-lake-05b69683bcbb'
---

Quem trabalha com engenharia de dados há algum tempo já passou pela situação clássica: você precisa fazer o match de schema entre duas fontes, uma delas tem uma coluna que sempre chega vazia, e de repente o Delta Lake reclama de um tipo `VOID`.

## O que é uma coluna VOID

Quando o Spark infere o schema de um dado em que **todos os valores de uma coluna são nulos**, ele não tem como deduzir o tipo. O resultado é o tipo `VOID` (também chamado de `NullType`). Em memória isso passa despercebido, mas na hora de gravar em Delta o problema aparece: o formato não aceita colunas `VOID`, porque um tipo precisa ser concreto para ser persistido e evoluído.

```python
df = spark.createDataFrame([(1, None)], "id INT, observacao VOID")
df.write.format("delta").save(path)  # falha
```

## Por que isso acontece em pipelines reais

O caso mais comum é leitura de JSON ou de APIs onde um campo opcional simplesmente nunca vem preenchido no lote atual. A inferência olha só para os dados daquele momento e conclui `VOID`. No dia seguinte, o mesmo campo chega com texto — e agora você tem um conflito de schema entre execuções.

## Como resolver

A correção é explicitar o tipo em vez de deixar o Spark inferir. Três abordagens, da mais robusta para a mais pontual:

1. **Schema explícito na leitura.** Nunca infira schema de dado externo em produção. Defina o `StructType` com o tipo correto (ex.: `StringType`) para o campo que costuma vir nulo.

2. **Cast antes de gravar.** Se a coluna já chegou como `VOID`, faça o cast para um tipo concreto:

```python
from pyspark.sql.functions import col
df = df.withColumn("observacao", col("observacao").cast("string"))
```

3. **Padronização na camada Bronze.** Garanta que a ingestão sempre materialize os tipos esperados, de forma que Silver e Gold nunca recebam `VOID`. Isso mantém o pipeline idempotente: a mesma entrada produz sempre o mesmo schema.

## Conclusão

`VOID` não é um bug — é o Spark sendo honesto sobre não saber o tipo. Em produção, a regra que evita 100% desses casos é simples: **schema explícito em toda leitura externa**. O resto é cast defensivo para os dados que já passaram pela porta.
