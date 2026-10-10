---
title: 'Choosing a Delta Lake Layout: When to Partition, Use Liquid Clustering, and Run OPTIMIZE'
description: 'An orders table is partitioned by date. That sounds reasonable — until an important query searches for one customer across the entire order history…'
date: 2026-10-01
tags: ['Data Engineering', 'Databricks', 'Delta Lake']
canonical: 'https://medium.com/@arthurfr23/choosing-a-delta-lake-layout-when-to-partition-use-liquid-clustering-and-run-optimize-c046650cb41b'
---

_Use cases, limits, SQL experiments, and a practical decision process for Databricks engineers._

An orders table is partitioned by date. That sounds reasonable — until an important query searches for one customer across the entire order history.

The date partitions cannot eliminate dates when the query has no date predicate. File statistics may still help, but the original layout decision does not directly address that access pattern.

It is tempting to respond by adding more maintenance commands. Before doing that, separate two decisions:

  - How should the table organize its data?
  - Which operation should maintain that organization?

This guide connects PARTITIONED BY, CLUSTER BY, OPTIMIZE, and ZORDER BY through three practical configurations. The examples target Delta tables in Databricks with Unity Catalog.

## 1. Separate table layout from maintenance

**PARTITIONED BY** — Defines table partition boundaries. Maintenance operates within those boundaries

**CLUSTER BY in table DDL** — Configures Liquid Clustering keys. OPTIMIZE uses those keys

**OPTIMIZE** — Rewrites files to improve their layout. Its behavior depends on the table configuration

**ZORDER BY inside** **OPTIMIZE** — Colocates values to support file skipping. Available for tables without Liquid Clustering

The table DDL syntax is PARTITIONED BY. The PARTITION BY expression used inside SQL window functions serves a different purpose.

For new tables, Databricks recommends Liquid Clustering. Existing partitioned tables still need an informed maintenance strategy, particularly while a migration is being evaluated. See the [partitioning guidance](https://docs.databricks.com/aws/en/tables/partitions).

## 2. Start with queries you actually need to support

For an orders workload, select several query shapes before changing the layout:

**Customer history** — customer_id = 842. Whether customer values can eliminate files

**Sales by country** — country_code = 'BR'. Whether country partition pruning helps

**Recent sales** — A bounded order_date range. Whether date filtering remains efficient

**Customer within a period** — Customer and date predicates. Whether the layout supports their combination

**Broad aggregation** — No selective filter. Whether scanning remains the dominant cost

Use actual frequent customers and date ranges from your workload. Include both common and rare values, especially if the distribution is skewed.

A layout that wins for one rare customer may disappoint when a large customer accounts for a substantial fraction of the table.

## Choose a candidate from the use case

The following cases are proposed experiments, not measured customer results.

**Case A: an existing sales table partitioned by country.** The business operates in a few countries, each with substantial stored data, and important queries consistently filter by country_code. A predicate such as WHERE country_code = 'BR' can prune other countries' partitions. Keep the existing layout as a baseline only when its benefit is measured. Low cardinality alone is insufficient: a dominant country can still require a large scan, while small markets can leave undersized partitions. Compare read and maintenance costs with a clustered candidate.

**Case B: orders searched by customer across many dates.** A customer-history query cannot prune date partitions using a customer-only predicate. Evaluate Liquid Clustering on customer_id; add order_date as a second candidate key when the workload also depends on selective date ranges. Measure both configurations rather than assuming two keys must outperform one.

**Case C: a growing table with uneven tenant distribution.** Partitioning by a high-cardinality tenant identifier can leave many tiny partitions alongside a few large ones. Evaluate clustering on the tenant identifier and any independently useful filter column. Include a large tenant in the test: clustering cannot skip rows that the query actually needs. File layout also does not automatically fix join skew or a poor execution plan.

**Case D: a small reference table or mostly full-table aggregations.** Keep a simple unpartitioned baseline. If all files are cheap to scan, additional layout maintenance may not pay for itself. For eligible managed tables, evaluate automatic clustering separately; do not assume it will always select keys.

## Low cardinality is only one condition

Country is the partitioning example here because its bounded set of values makes the trade-off clear. Check stored bytes per country, distribution skew, and actual country predicates. A table with five countries does not automatically have five useful partitions. If one country holds nearly all the data, its queries still read most of the table.

Daily DATE partitioning can be valid in some workloads; it is different from partitioning on a raw event TIMESTAMP. We use country to keep this walkthrough focused, not because all date partitioning is incorrect. For a new Databricks table, evaluate Liquid Clustering first.

## Size guidance and feature limits

Databricks advises against partitioning below 1 TB and recommends at least 1 GB per partition. These are planning recommendations, not enforced engine limits. Crossing either threshold does not establish that partitioning is the best choice. See the [current partitioning recommendations](https://docs.databricks.com/aws/en/tables/partitions#minimum-size-recommendations).

Liquid Clustering supports up to four keys, and those columns need file statistics. More keys can dilute the benefit for queries filtering on only one column. It cannot coexist with table partitioning or Z-order on the same Delta table. Check the [clustering requirements](https://docs.databricks.com/aws/en/tables/clustering#choose-clustering-keys) and the compatibility of every reader and writer before migration.

## Inspect the current layout first

```sql
DESCRIBE DETAIL main.slv_sales.slv_orders;
DESCRIBE HISTORY main.slv_sales.slv_orders;
```

Record partitionColumns, clusteringColumns, numFiles, and sizeInBytes from the detail output where available, and recent write and optimization operations from history. Dividing table bytes by file count gives a rough average file size, not a distribution of partition sizes.

For a partitioned source, this query reveals row-count imbalance by country:

```sql
SELECT
  country_code,
  COUNT(*) AS row_count
FROM main.slv_sales.slv_orders
GROUP BY country_code
ORDER BY row_count DESC;
```

Run it when the diagnostic scan is justified. Row counts do not prove that a partition contains 1 GB: compression and row width vary. Measure partition storage separately when that criterion drives the decision.

## 3. Create three configurations in an isolated lab

Use an existing Unity Catalog catalog where you can create managed tables. The examples use main; replace it with your catalog.

For a consistent walkthrough, use Databricks Runtime 16.4 LTS or newer. The optional partition-conversion example later requires 18.1 or newer. These examples are configuration templates, not results from a production benchmark.

Create a dedicated schema:

```sql
CREATE SCHEMA IF NOT EXISTS main.gld_layout_lab;
```

**Configuration A: no partitions and no Liquid Clustering**

```sql
CREATE TABLE main.gld_layout_lab.gld_orders_plain (
  order_id BIGINT,
  customer_id BIGINT,
  order_date DATE,
  country_code STRING,
  net_revenue DECIMAL(18, 2)
)
USING DELTA;
```

**Configuration B: partitioned by country**

```sql
CREATE TABLE main.gld_layout_lab.gld_orders_partitioned (
  order_id BIGINT,
  customer_id BIGINT,
  order_date DATE,
  country_code STRING,
  net_revenue DECIMAL(18, 2)
)
USING DELTA
PARTITIONED BY (country_code);
```

**Configuration C: Liquid Clustering**

```sql
CREATE TABLE main.gld_layout_lab.gld_orders_liquid (
  order_id BIGINT,
  customer_id BIGINT,
  order_date DATE,
  country_code STRING,
  net_revenue DECIMAL(18, 2)
)
USING DELTA
CLUSTER BY (customer_id, order_date);
```

The clustered table has no PARTITIONED BY clause. These are three separate configurations, not three steps to apply to one table. The [table CLUSTER BY reference](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-syntax-ddl-cluster-by) documents the DDL syntax.

## Load the same snapshot

Assume your source is a Delta table called main.slv_sales.slv_orders with the five columns shown above and a unique, non-null order_id.

Use DESCRIBE HISTORY to choose one retained source version:

```sql
DESCRIBE HISTORY main.slv_sales.slv_orders;
```

In the following template, replace 123 with that version. Run it for each target table, changing only the target name. Keep the selected source version fixed throughout the comparison.

```sql
MERGE INTO main.gld_layout_lab.gld_orders_plain AS target
USING (
  SELECT
    order_id,
    customer_id,
    order_date,
    country_code,
    net_revenue
  FROM main.slv_sales.slv_orders VERSION AS OF 123
) AS source
ON target.order_id = source.order_id
WHEN NOT MATCHED THEN INSERT (
  order_id,
  customer_id,
  order_date,
  country_code,
  net_revenue
)
VALUES (
  source.order_id,
  source.customer_id,
  source.order_date,
  source.country_code,
  source.net_revenue
);
```

This insert-only load is repeatable against the same snapshot when the source key is unique. It is a lab loading pattern, not an SCD implementation.

Create fresh target tables for a new source snapshot. Reusing this insert-only load with a different snapshot would leave old values in the targets.

Before benchmarking, verify that the three copies contain the same rows. A row count and revenue total are useful first checks; use a bidirectional EXCEPT ALL over the five columns when you need exact multiset equality.

For a controlled manual experiment, keep scheduled maintenance from changing the lab tables between runs. If predictive optimization is inherited, a table owner can disable it on these three lab tables only:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_plain
DISABLE PREDICTIVE OPTIMIZATION;
```

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_partitioned
DISABLE PREDICTIVE OPTIMIZATION;
```

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
DISABLE PREDICTIVE OPTIMIZATION;
```

Record the original maintenance configuration. This isolation step is for the experiment, not a recommendation to disable automated maintenance in production.

## 4. Apply maintenance that matches each layout

For the plain table:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_plain;
```

Without Liquid Clustering or a ZORDER BY clause, this performs bin-packing compaction. It does not introduce customer-based clustering.

For the partitioned table, first test ordinary compaction:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_partitioned;
```

Record the query measurements. Then test the optional Z-order treatment:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_partitioned
ZORDER BY (customer_id);
```

This adds value colocation within each country partition. Z-order can also be used on an unpartitioned table; it is not exclusive to partitioned tables.

For the Liquid Clustering table:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_liquid;
```

Here the operation uses the configured clustering keys. Do not append ZORDER BY to this command.

These are file rewrite operations. The [OPTIMIZE reference](https://docs.databricks.com/aws/en/sql/language-manual/delta-optimize) describes how compaction and Z-order differ; the [layout maintenance guide](https://docs.databricks.com/aws/en/tables/operations/optimize) explains the behavior for clustered and partitioned tables.

## 5. Inspect file skipping, not just the stopwatch

Run a representative query against each target:

```sql
SELECT
  customer_id,
  SUM(net_revenue) AS net_revenue
FROM main.gld_layout_lab.gld_orders_plain
WHERE customer_id = 842
  AND order_date >= DATE '2026-09-01'
  AND order_date < DATE '2026-10-01'
GROUP BY customer_id;
```

Change only the table name when comparing configurations. Repeat the other query shapes from the workload matrix.

In Databricks SQL, disable result reuse for the measurement session:

```sql
SET use_cached_result = false;
```

This controls the [SQL result cache](https://docs.databricks.com/aws/en/sql/language-manual/parameters/use_cached_result). It does not clear disk or other caches, so record the cache conditions instead of assuming every run is cold.

Open **Query History → query details → See query profile**. Inspect the scan and the expensive operators. The [query profile](https://docs.databricks.com/aws/en/sql/user/queries/query-profile) exposes execution and I/O details that help distinguish less scanning from faster cached access.

Keep the following measurements:

**Files and bytes read** — Shows whether the scan did less work

**Execution latency** — Captures the user-visible benefit

**Queue and startup time** — Separates compute availability from query execution

**Files added and removed by maintenance** — Shows how much layout work was performed

**Maintenance duration and compute cost** — Helps judge whether the read benefit pays for the rewrite

**Write or MERGE latency** — Detects regressions in ingestion and updates

Use the same compute configuration and alternate the execution order. Report a median and range across several runs rather than selecting the fastest result.

## Check the statistics behind skipping

File skipping relies on statistics such as minimum and maximum values. Clustering can make those ranges more useful, but skipping is also available on partitioned and unclustered Delta tables.

For manual statistics management, you can explicitly choose the relevant columns:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
SET TBLPROPERTIES (
  'delta.dataSkippingStatsColumns' = 'customer_id,order_date,country_code'
);
```

```sql
ANALYZE TABLE main.gld_layout_lab.gld_orders_liquid
COMPUTE DELTA STATISTICS;
```

Apply a consistent statistics policy to every comparison table before measuring. Changing the property alone does not backfill statistics for existing data. See the [data-skipping documentation](https://docs.databricks.com/aws/en/tables/data-skipping).

## 6. Separate a key change from historical reclustering

Suppose your experiment shows that customer-only access dominates and you want to evaluate a single key:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
CLUSTER BY (customer_id);
```

That changes the configuration. It does not immediately reorganize all previously clustered data.

To force the historical data to be reclustered under the current configuration:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_liquid FULL;
```

Treat this as an explicit maintenance event and measure its cost. Subsequent incremental maintenance and a historical layout change are different experiments.

The [Delta Lake clustering guide](https://docs.delta.io/delta-clustering/) explains the distinction between changing keys, incremental clustering, and forcing reclustering. Runtime support differs between open-source Delta Lake and Databricks; the walkthrough here targets Databricks.

## 7. Know what automatic clustering automates

For eligible Unity Catalog managed tables:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
ENABLE PREDICTIVE OPTIMIZATION;
```

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
CLUSTER BY AUTO;
```

Automatic Liquid Clustering selects keys using workload information. Predictive optimization performs maintenance asynchronously. They are related capabilities with different responsibilities.

Use this as a separate phase after the manual comparison. Otherwise, an evolving configuration makes the experiment harder to interpret.

Predictive optimization also runs ANALYZE and VACUUM; it is not simply an automatic OPTIMIZE schedule. Review the existing retention policy and account for its serverless maintenance cost. Avoid overlapping manual jobs for the same responsibility. See [predictive optimization](https://docs.databricks.com/aws/en/optimizations/predictive-optimization) and [automatic Liquid Clustering](https://docs.databricks.com/aws/en/tables/clustering#automatic-liquid-clustering).

## A note on existing partitioned tables

Databricks Runtime 18.1 and newer provides a dedicated conversion command:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_partitioned
REPLACE PARTITIONED BY WITH CLUSTER BY (
  order_date,
  customer_id
);
```

This is an optional migration experiment after the comparison, not another optimization to stack on the partitioned baseline. Plan the following OPTIMIZE and inspect dependencies before applying it to production. Consult the [conversion requirements](https://docs.databricks.com/aws/en/tables/clustering#convert-a-partitioned-table-to-liquid-clustering), especially for streaming consumers and partition-filtered sharing.

## 8. Diagnose the result before adopting the layout

**Fewer files, similar bytes read** — Compaction helped file overhead; check whether predicates can skip more data

**Fewer bytes read, similar latency** — Inspect joins, shuffles, queue time, and other dominant operators

**Customer queries improve, date queries regress** — Revisit key selection and weight results by actual query frequency

**Queries improve but maintenance becomes expensive** — Reassess maintenance cadence and total workload cost

**No measurable change** — Verify statistics, selectivity, cache conditions, and whether the table was already well organized

Use a result sheet with one row per query shape and configuration. Record median execution time, bytes read, files read, result equality, and the cost of each maintenance treatment. Leave missing metrics blank rather than estimating them from a screenshot or an unrelated run.

Set acceptance criteria before the experiment: required query latency, maximum tolerated regression for other queries, ingestion SLA, and maintenance budget. The thresholds should come from your application, not a universal percentage.

## 9. Make the decision with the whole workload

For a new Databricks table, begin by evaluating the recommended Liquid Clustering path. For an existing table, establish a baseline before changing anything.

Keep the configuration that meets your latency targets with an acceptable combined cost of reads, writes, and maintenance. A useful decision record contains the source snapshot, table configurations, representative predicates, compute settings, cache conditions, and measured results.

If a change improves one customer query but makes the frequent date-range workload worse, that trade-off belongs in the decision. If the table is small and scans were already cheap, a more elaborate layout may offer little practical benefit.

The next time an OPTIMIZE job finishes successfully, check the workload measurements too. Successful maintenance proves that the operation ran; its value comes from what changed for the queries and pipelines that use the table.
