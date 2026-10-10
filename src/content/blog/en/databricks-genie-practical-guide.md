---
title: 'Databricks Genie: A Practical Guide from Tables to Tested Answers'
description: 'A query can execute successfully and still answer the wrong question. A practical guide to building a focused Genie Agent with business rules, reference SQL and benchmarks…'
date: 2026-09-25
tags: ['Databricks', 'Genie', 'AI']
canonical: 'https://medium.com/@arthurfr23/databricks-genie-a-practical-guide-from-tables-to-tested-answers-aa91dff98587'
---

_Build a focused sales analytics assistant with explicit business rules, reference SQL, and benchmarks._

A query can execute successfully and still answer the wrong question.

Ask “What was our revenue last month?” and several interpretations become possible. Gross or net revenue? Including canceled orders? Based on the purchase date or the payment date?

A conversational interface makes asking the question easier. The engineering work is making its meaning explicit and checking the answer.

This tutorial walks through a small sales analytics example: prepare a dataset, configure its context in Genie, add reference queries, and evaluate the results.

The data is synthetic. The expected results are derived from the sample rows, not from a measured Genie deployment.

## What we are configuring

The current Databricks documentation calls these **Genie Agents**, formerly **Genie Spaces**. They allow users to ask questions about configured data using natural language. This tutorial focuses on that analytical experience, rather than the developer assistant Genie Code. [Databricks concepts](https://docs.databricks.com/aws/en/genie-agents/concepts)

Our initial scope is deliberately narrow:

  - Monthly net revenue.
  - Revenue by customer segment.
  - Completed and canceled order counts.

Churn, forecasts, and product profitability are outside the scope.

That boundary gives us something we can evaluate before adding more tables and questions.

## 1. Create a dataset with known answers

You need a Unity Catalog-enabled workspace, an existing catalog where you can create a demo schema and table, and an eligible SQL warehouse. Genie authors need the relevant data privileges and access to the selected warehouse. Check your workspace against the [current setup requirements](https://docs.databricks.com/aws/en/genie-agents/set-up).

Run the following in a SQL editor, replacing your_catalog with an existing development catalog. Use a fresh demo schema so the expected results remain reproducible.

```sql
USE CATALOG your_catalog;
```

```sql
CREATE SCHEMA IF NOT EXISTS gld_genie_demo;
```

```sql
CREATE TABLE IF NOT EXISTS gld_genie_demo.gld_orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_date DATE,
    customer_segment STRING,
    order_status STRING,
    net_revenue DECIMAL(18, 2)
)
USING DELTA;
```

We are declaring the schema explicitly. Money uses a decimal type, and the table has one row per order.

Seed five records:

```sql
MERGE INTO gld_genie_demo.gld_orders AS target
USING (
    SELECT
        CAST(order_id AS BIGINT) AS order_id,
        CAST(customer_id AS BIGINT) AS customer_id,
        CAST(order_date AS DATE) AS order_date,
        CAST(customer_segment AS STRING) AS customer_segment,
        CAST(order_status AS STRING) AS order_status,
        CAST(net_revenue AS DECIMAL(18, 2)) AS net_revenue
    FROM VALUES
        (1, 101, '2026-08-05', 'SMB',        'COMPLETED', 100.00),
        (2, 102, '2026-08-10', 'ENTERPRISE', 'CANCELLED', 200.00),
        (3, 103, '2026-08-20', 'ENTERPRISE', 'COMPLETED', 300.00),
        (4, 101, '2026-09-02', 'SMB',        'COMPLETED', 150.00),
        (5, 104, '2026-09-08', 'ENTERPRISE', 'COMPLETED', 450.00)
    AS seed (
        order_id,
        customer_id,
        order_date,
        customer_segment,
        order_status,
        net_revenue
    )
) AS source
ON target.order_id = source.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

The MERGE lets you rerun the seed without duplicating these orders. It does not remove unrelated rows, which is why a dedicated demo table matters.

For this exercise, our business definition is:

> _Revenue is the sum of net_revenue for completed orders, grouped by purchase date. All amounts are in BRL._

Under that definition:

  - August 2026: **BRL 400.00**.
  - September 2026: **BRL 600.00**.

The canceled August order retains its recorded amount. The status filter determines whether that amount contributes to our metric.

## 2. Document meaning, not just column names

A description such as “Net revenue column” adds almost nothing.

Useful metadata explains the value, unit, grain, and exceptions.

```sql
COMMENT ON TABLE gld_genie_demo.gld_orders IS
'Synthetic sales dataset. One row per order_id.
Includes completed and canceled orders.
customer_segment is recorded at purchase time.
All monetary amounts are in BRL.';
```

```sql
ALTER TABLE gld_genie_demo.gld_orders
ALTER COLUMN net_revenue COMMENT
'Order amount after discounts and refunds, in BRL.
For revenue reporting, include only COMPLETED orders.';
```

```sql
ALTER TABLE gld_genie_demo.gld_orders
ALTER COLUMN order_date COMMENT
'Purchase date. Not payment date or shipment date.';
```

```sql
ALTER TABLE gld_genie_demo.gld_orders
ALTER COLUMN order_status COMMENT
'Order status: COMPLETED or CANCELLED.';
```

Check the grain before going further:

```sql
SELECT
    COUNT(*) AS row_count,
    COUNT(DISTINCT order_id) AS distinct_order_count
FROM gld_genie_demo.gld_orders;
```

For this fixture, both values should be 5.

In a production dataset, a mismatch would require investigation. A descriptive comment cannot make a duplicate key unique.

## 3. Create a focused Genie Agent

In the current interface:

  1. Open **Genie Agents** and select **New**.
  2. Add the demo table as a source.
  3. Create the agent.
  4. Review the selected SQL warehouse under **Configure → Settings**.
  5. Review any generated configuration suggestions before accepting them.

The current setup flow can use Genie Code to suggest context. Treat those suggestions as drafts to inspect, especially business definitions and example queries. [Creation workflow](https://docs.databricks.com/aws/en/genie-agents/set-up)

Use a clear title, such as **Sales Analytics Demo**, and a description that states its scope:

> _Answers questions about completed-order revenue and order counts in the synthetic sales dataset. Amounts are in BRL. Churn and forecasts are not defined._

Avoid adding every available table at this stage. Start with the sources needed to answer your initial questions.

## 4. Add precise business instructions

Metadata describes the data. Instructions explain how to interpret questions in this domain.

Here is a starting configuration for the demo:

```
Scope:
- Answer questions about order revenue and order counts.
- Currency is BRL. Currency conversion is not available.
```

```
Revenue:
- Use net_revenue.
- Include only orders with order_status = 'COMPLETED'.
- Aggregate by order_date, which represents purchase date.
```

```
Order counts:
- For total orders, include all statuses.
- For completed orders, filter to COMPLETED.
- For canceled orders, filter to CANCELLED.
```

```
Time:
- Use calendar months and calendar quarters.
- Ask for clarification when the requested period is ambiguous.
```

```
Undefined metrics:
- Churn and profit are not defined in this dataset.
- Explain the missing definition instead of inventing a formula.
```

Notice the separation between revenue and order counts.

A blanket instruction to “always exclude canceled orders” would conflict with a legitimate question such as “How many orders were canceled?”

Instructions should resolve ambiguity without blocking valid analysis.

Genie can also use an agent-level knowledge store for descriptions, relationships, and other semantic context. Those configurations are scoped to the agent and do not change Unity Catalog metadata. [Context configuration concepts](https://docs.databricks.com/aws/en/genie-agents/concepts)

## 5. Add a reviewed SQL example

Choose a recurring question:

> _What is our completed-order net revenue by month?_

Use a fully qualified table reference, replacing your_catalog:

```sql
SELECT
    CAST(date_trunc('month', order_date) AS DATE) AS revenue_month,
    SUM(net_revenue) AS net_revenue_brl
FROM your_catalog.gld_genie_demo.gld_orders
WHERE order_status = 'COMPLETED'
GROUP BY 1
ORDER BY 1;
```

The expected output is:

```
revenue_month | net_revenue_brl
2026-08-01    | 400.00
2026-09-01    | 600.00
```

Add the reviewed question and query to the agent’s SQL examples.

Keep three concepts separate:

  - **Example SQL** provides reference logic for generating answers.
  - **Trusted assets** involve verified logic in parameterized example queries or SQL functions.
  - **Benchmarks** evaluate answers; they do not supply answering context.

An ordinary example query should not automatically be described as a trusted asset. [Official definitions](https://docs.databricks.com/aws/en/genie-agents/concepts)

## 6. Test answers with benchmarks

A successful conversation is a useful spot check. It is not enough to establish consistent behavior.

Build a small test set with explicit expected results:

  - **What was net revenue in August 2026?** BRL 400.00.
  - **What was net revenue in September 2026?** BRL 600.00.
  - **How many orders were placed in August 2026?** 3.
  - **How many August orders were canceled?** 1.
  - **What was enterprise revenue in August 2026?** BRL 300.00.
  - **What was churn in August 2026?** Explain that churn is undefined.

For the August revenue question, the reference SQL is:

```sql
SELECT
    SUM(net_revenue) AS net_revenue_brl
FROM your_catalog.gld_genie_demo.gld_orders
WHERE order_status = 'COMPLETED'
  AND order_date >= DATE '2026-08-01'
  AND order_date < DATE '2026-09-01';
```

In **Benchmarks**, add the question and its **SQL Answer**, then run the evaluation in **Chat mode**. Inspect the generated query and the comparison result.

Chat-mode evaluation can compare results against reference SQL. Questions without a SQL answer require manual review. Agent-mode evaluation uses a different grading approach, so keep the mode consistent when comparing runs. [Benchmark documentation](https://docs.databricks.com/aws/en/genie-agents/monitor)

Add alternative phrasings, such as:

  - “How much net revenue did we generate during August 2026?”
  - “Show August 2026 revenue from completed orders.”

Also include questions that are not copies of your SQL examples. Otherwise, your test set may be too narrow to expose gaps.

For each failure, identify the category before changing anything:

  - **Includes canceled orders:** investigate the status rule or a missing filter.
  - **Uses the wrong month:** investigate the date field or boundary interpretation.
  - **Returns the wrong segment:** investigate category values or the segment definition.
  - **Invents churn:** investigate scope instructions and clarification behavior.
  - **Produces unexpected totals:** investigate grain, joins, duplicates, or the metric definition.

Change the relevant context, rerun the suite, and check whether previously correct cases still pass.

## 7. Watch for join fanout as the model grows

Suppose you later add an order-items table.

The relationship becomes:

```
gld_orders: one row per order
             1 → N
gld_order_items: one row per order item
```

If an order worth BRL 300 has three items, joining the tables produces three rows containing that order-level value. Summing it after the join can yield BRL 900.

SUM(DISTINCT net_revenue) is not a general solution: different orders can legitimately have the same value.

The correct approach depends on the question. You might aggregate items before joining, query at order grain, or define an allocation rule for product-level revenue.

When adding a new table, add tests that exercise its relationships. Do not assume the old benchmark suite covers the expanded model.

## 8. Validate access and operating behavior

Correct results are only one part of readiness.

Genie distinguishes warehouse access from data access. The configured compute credentials provide warehouse access, while Unity Catalog evaluates data access using the end user’s identity. [Access model](https://docs.databricks.com/aws/en/genie-agents/set-up)

Test with a representative consumer account, not only the author’s account.

My release checklist would include:

  - Supported business questions have reviewed expected answers.
  - Undefined metrics produce an appropriate clarification.
  - Join-sensitive questions preserve the intended grain.
  - Representative users see only authorized data.
  - Query latency and cost are acceptable for the expected workload.
  - Instructions and reference queries have an owner.
  - Configuration changes trigger another evaluation run.

For changing datasets, compare Genie and reference results against consistent data. Otherwise, a refresh between executions can look like a reasoning failure.

The SQL here is a walkthrough to run in your development workspace. It does not represent a tested production deployment or a guarantee of Genie accuracy.

## Start with a domain you can verify

A useful first deployment does not need to answer every question about the company.

It needs a defined scope, explicit metric meanings, suitable data, and a test set that catches meaningful errors.

Expand when you can explain both why an answer is correct and how you would detect when it stops being correct.
