---
title: 'VOID Columns in Delta Lake'
description: 'Why a typeless column shows up in your Delta schema, what it breaks, and how to fix it idempotently.'
date: 2026-05-07
tags: ['Delta Lake', 'Databricks', 'Spark']
canonical: 'https://medium.com/@arthurfr23/colunas-void-no-delta-lake-05b69683bcbb'
---

If you've been doing data engineering for a while, you've hit the classic situation: you need to match the schema between two sources, one of them has a column that always arrives empty, and suddenly Delta Lake complains about a `VOID` type.

## What is a VOID column

When Spark infers the schema of data where **every value in a column is null**, it has no way to deduce the type. The result is the `VOID` type (also called `NullType`). In memory it goes unnoticed, but writing to Delta surfaces the problem: the format doesn't accept `VOID` columns, because a type must be concrete to be persisted and evolved.

```python
df = spark.createDataFrame([(1, None)], "id INT, note VOID")
df.write.format("delta").save(path)  # fails
```

## Why it happens in real pipelines

The most common case is reading JSON or APIs where an optional field simply never comes populated in the current batch. Inference looks only at that moment's data and concludes `VOID`. The next day the same field arrives with text — and now you have a schema conflict between runs.

## How to fix it

The fix is to make the type explicit instead of letting Spark infer it. Three approaches, from most robust to most ad hoc:

1. **Explicit schema on read.** Never infer the schema of external data in production. Define the `StructType` with the correct type (e.g. `StringType`) for the field that tends to come null.

2. **Cast before writing.** If the column already arrived as `VOID`, cast it to a concrete type:

```python
from pyspark.sql.functions import col
df = df.withColumn("note", col("note").cast("string"))
```

3. **Standardize at the Bronze layer.** Make sure ingestion always materializes the expected types, so Silver and Gold never receive `VOID`. This keeps the pipeline idempotent: the same input always produces the same schema.

## Takeaway

`VOID` isn't a bug — it's Spark being honest about not knowing the type. In production, the rule that avoids 100% of these cases is simple: **explicit schema on every external read**. The rest is defensive casting for data that already made it through the door.
