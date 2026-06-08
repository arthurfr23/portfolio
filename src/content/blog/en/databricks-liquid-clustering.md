---
title: 'Liquid Clustering in Databricks: the evolution of OPTIMIZE + ZORDER in Delta Lake'
description: 'If you have worked with Delta Lake in Databricks for a while, you have certainly come across the OPTIMIZE + ZORDER BY combo to physically organize…'
date: 2026-05-04
tags: ['Data Engineering', 'Databricks', 'Data Science']
canonical: 'https://medium.com/@arthurfr23/liquid-clustering-no-databricks-a-evolu%C3%A7%C3%A3o-do-optimize-zorder-no-delta-lake-e3632494b7bb'
---

If you have worked with Delta Lake in Databricks for a while, you have certainly come across the `OPTIMIZE` + `ZORDER BY` combo to physically organize the data in your tables. It is an approach that works, solves real performance problems, and is part of the daily routine of anyone dealing with large-scale pipelines. But like any solution born from a specific context, it carries limitations that become visible as the data volume grows and access patterns become more complex.

Databricks introduced **Liquid Clustering** as the direct evolution of this approach. It is not a cosmetic change, it is a reimagining of how the physical organization of data should work in a Data Lakehouse environment. And understanding this difference, from a technical standpoint, makes a real difference in the design of your tables and pipelines.

In this article I will cover what changes: how `OPTIMIZE` and `ZORDER` work internally, where they fail, and how Liquid Clustering solves these problems with a different approach. I will also show how to implement it in practice with concrete examples.

## What OPTIMIZE actually does

`OPTIMIZE` solves a classic Data Lake problem: the accumulation of small files. In a typical incremental pipeline, each micro-batch or ingestion job writes a number of files to storage. Over time, a table that should have 50 files of 128MB ends up with 50,000 files of 128KB. The impact is direct on query planning: Spark needs to open and read the metadata of each file individually, and this creates overhead even before processing a single row of data.

```sql
OPTIMIZE catalog.schema.table
```

Internally, `OPTIMIZE` reads the small files, consolidates them into larger files (close to the target size, usually 128MB or 256MB depending on the configuration) and rewrites them to storage. The Delta Log is updated to reflect the new file structure. The old files are not deleted immediately, they are marked as removed in the log and cleaned up later by `VACUUM`.

On its own, `OPTIMIZE` does not order the data by any specific criterion. It only compacts. To add physical order that benefits queries filtered by specific columns, you add `ZORDER BY`.

```sql
OPTIMIZE catalog.schema.table ZORDER BY (customer_id, event_date)
```

Z-Ordering is a multidimensional space-filling curve algorithm that co-locates records with similar values in the specified columns within the same Parquet files. The practical effect is that a query with a filter on `customer_id` can skip entire files via **data skipping**, because Delta Lake keeps min/max statistics per file. If the file contains only `customer_id` between 1000 and 2000, and the query looks for `customer_id = 5000`, the file is completely ignored.

## The limits of ZORDER

`ZORDER` works well in simple scenarios. The problem appears when you start having more sophisticated requirements.

**Problem 1: high-cardinality columns with uneven distribution.**

If you do `ZORDER BY (customer_id)` and have customers with very different data volumes (some with 10 records, others with 10 million), the algorithm does not distribute efficiently. Co-location is impaired precisely for the most relevant customers.

**Problem 2: multiple columns compete with each other.**

Z-Ordering tries to balance the co-location of all listed columns. The more columns you add, the less efficient it becomes for each one individually. In practice, with more than 3–4 columns, the benefit starts to diminish significantly.

**Problem 3: the process is non-incremental.**

Every time you run `OPTIMIZE ZORDER BY`, it needs to rewrite the files to re-order the data. There is no mechanism to leverage work already done. On large tables, this means rewriting hundreds of gigabytes or terabytes regularly, with computation cost and time proportional to that.

**Problem 4: changing columns is traumatic.**

If you decided to do `ZORDER BY (region)` and later realized that the access pattern changed and `product_category` would be more useful, you need to run a full `OPTIMIZE ZORDER BY (product_category)` on the entire table. There is no way to do this incrementally.

## How Liquid Clustering works

Liquid Clustering solves these problems with a different architecture. Instead of using Z-Ordering as a physical ordering algorithm applied in batch, it uses a system based on **Hilbert curves** to organize the data and, more importantly, does so **incrementally and adaptively**.

You define the clustering columns at table creation:

```sql
CREATE TABLE catalog.schema.table
USING DELTA
CLUSTER BY (customer_id, event_date)
AS SELECT * FROM source_table;
```

Or add clustering to an existing table:

```sql
ALTER TABLE catalog.schema.table
CLUSTER BY (customer_id, event_date);
```

From then on, when you run `OPTIMIZE`, Databricks applies clustering incrementally, prioritizing only the files that are not yet clustered or that were invalidated by new writes.

```sql
OPTIMIZE catalog.schema.table
```

Yes, the same old `OPTIMIZE`. But now it knows the table has Liquid Clustering defined and acts accordingly.

## Why Hilbert Curves instead of Z-Order

Both Z-Ordering and Liquid Clustering are space-filling curve techniques, but Hilbert curves have an important mathematical property: they preserve **locality** more efficiently. Points that are close in multidimensional space stay closer on the Hilbert curve than on the Z curve. For workloads with filters on multiple columns simultaneously, data skipping becomes more effective.

## Incremental clustering in practice

The most impactful difference in day-to-day use is the incremental behavior. Delta Lake tracks which files have already been processed by the clustering engine. When new data arrives (via INSERT, MERGE, or any write operation), only the new or affected files need to be reorganized in the next `OPTIMIZE`. Tables that are already well clustered go through `OPTIMIZE` much faster.

## Practical example: creating and monitoring a table with Liquid Clustering

Let's create an events table with Liquid Clustering defined on two columns common in user-behavior analytics:

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

# Inserting data and running OPTIMIZE
spark.sql("""
    INSERT INTO catalog.schema.user_events
    SELECT * FROM catalog.staging.user_events_landing
    WHERE processed_date = current_date()
""")

# OPTIMIZE now applies incremental clustering
spark.sql("OPTIMIZE catalog.schema.user_events")
```

To check whether clustering is being applied and the current state of the table:

```sql
-- Checks the clustering properties of the table
DESCRIBE DETAIL catalog.schema.user_events;
```

```python
# Checking the clustering level of the files
# The clusteringScore column indicates how well clustered each file is
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

You can also inspect the clustering state using the native function:

```sql
SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'user_events';
```

Or via Python with the Delta API:

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forName(spark, "catalog.schema.user_events")

# Table details, including clusteringColumns
detail = delta_table.detail()
detail.select("clusteringColumns", "numFiles", "sizeInBytes").show()
```

## Changing clustering columns without pain

One of the most practical advantages. If access patterns changed and you need to swap the clustering columns, all it takes is an `ALTER TABLE`:

```sql
-- Before: clustering by customer_id and event_date
-- After: adds product_id as a clustering column
ALTER TABLE catalog.schema.user_events
CLUSTER BY (customer_id, event_date, product_id);
```

The next `OPTIMIZE` will apply the new clustering incrementally. There is no need to rewrite the entire table at once. The system will gradually reorganize the files as they are processed.

## When NOT to use Liquid Clustering

Liquid Clustering is not a silver bullet. Some scenarios where the old approach still makes sense:

- **Small tables (less than a few GB):** the management overhead is not worth it. Partition + simple OPTIMIZE solves it.

- **Tables with 100% predictable access patterns by a single low-cardinality column:** partitioning by date is still very efficient and more direct.

- **Environments that do not run Databricks Runtime 13.3 LTS or higher:** Liquid Clustering requires a specific runtime version.

## Conclusion

`OPTIMIZE` + `ZORDER BY` was a good solution to a real problem, but it was born with structural limitations: a non-incremental reorganization process, performance degradation with multiple columns, and a high cost for strategy changes. Liquid Clustering solves these three points with a more mature approach.

In practice, what changes in your work is:

```
1. You define clustering at table creation (or via `ALTER TABLE`), not at the moment of `OPTIMIZE`.
2. `OPTIMIZE` becomes an incremental operation, faster on tables that are already well organized.
3. Changing the clustering strategy does not imply rewriting everything at once.
4. Tables with multiple filter columns benefit the most, because Hilbert curves preserve locality better than Z-Ordering.
```

The honest limitation worth mentioning: Liquid Clustering is evolving. Some integrations with third-party tools that read Delta Lake directly do not yet leverage the clustering in the ideal way. And, like any relatively new feature, it is prudent to test in a non-production environment before migrating critical tables.

If you are still using `ZORDER BY` on tables larger than 100GB with access by multiple columns, it is worth dedicating a few hours to evaluate Liquid Clustering. The migration cost is low and the gain in query latency and `OPTIMIZE` time is usually relevant enough to justify it.
