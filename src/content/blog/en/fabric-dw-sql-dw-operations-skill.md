---
title: 'Diagnosing Fabric Data Warehouse with the SQL DW Operations Skill: Investigating Workloads Without Leaving Copilot'
description: 'When a warehouse starts showing signs of slowness, the investigation rarely begins with clear answers. It begins with questions…'
date: 2026-09-17
tags: ['Microsoft Fabric', 'AI', 'Data Engineering', 'Azure']
canonical: 'https://medium.com/@arthurfr23/diagnosing-fabric-data-warehouse-with-the-sql-dw-operations-skill-investigating-workloads-without-e4060fe8661e'
---

When a warehouse starts showing signs of slowness, the investigation rarely begins with clear answers. It begins with questions. Was there a capacity spike? Did a specific query suddenly become expensive? Are requests failing, being cancelled, or simply taking longer than expected? Answering these questions in Microsoft Fabric, until recently, required considerable manual work: opening the Fabric Capacity Metrics app, cross-referencing it with Query Insights, querying the SQL pool’s DMVs, and still trying to correlate time windows across tools that don’t talk to each other directly.

This fragmented diagnostic flow is one of the biggest productivity drains for anyone operating Data Warehouses in Fabric. You lose time not because the problem is hard, but because the data is scattered. And by the time you finally reach the root cause, you’ve spent more energy navigating between interfaces than actually analyzing the problem.

The SQL DW Operations skill, now GA (Generally Available), was designed to solve exactly this gap. It brings the ability to investigate Fabric Data Warehouse workloads directly via Copilot, consolidating the main diagnostic sources into a conversational interface. In this article, I’ll detail what this skill does, how it works under the hood, what its real limitations are, and when it actually adds value in the day-to-day of those operating Fabric environments.

## What the SQL DW Operations Skill Is and How It Works

The SQL DW Operations skill is a capability added to Copilot in Microsoft Fabric that allows you to investigate the operational behavior of a Fabric Data Warehouse using natural language. It’s available as a skill within the Fabric Copilot agent, which means it isn’t a standalone product, but an extension of the AI agents layer Microsoft has been building on top of Fabric.

Under the hood, the skill accesses data from three main sources:

  - **Query Insights**: management views on query executions, including history, latency, frequency, and execution status.
  - **Fabric Capacity Metrics**: data on CU (Capacity Unit) consumption, throttling, and utilization over time.
  - **SQL pool DMVs**: dynamic management views that expose the current state of sessions, active queries, waits, and locks.

The idea is that instead of manually navigating through these sources, you simply ask a question like “what were the slowest queries in the last 2 hours?” or “was there throttling on the warehouse between 2pm and 3pm today?” and the skill correlates the sources, generates the answer, and, when relevant, shows the SQL that was executed to arrive at that answer — which matters for auditability.

## Types of Questions the Skill Can Answer

Based on the documentation and examples shared on Microsoft’s official blog, the SQL DW Operations skill covers the following scenarios well:

**1. Slow query diagnostics** You can ask about queries that exceeded a given time threshold, identify whether there was a performance regression in specific queries, and view the execution plan of historical queries via Query Insights.

**2. Failure and cancellation analysis** The skill can filter executions with error or cancellation status within a time window, which is useful for correlating failures with capacity events or load changes.

**3. Capacity consumption** Questions about CU consumption spikes, throttling periods, and load distribution throughout the day are answered by cross-referencing Capacity Metrics data with execution history.

**4. Current warehouse state** For real-time diagnostics, the skill can query active sessions, running queries, and waits — something that previously required a direct connection to the warehouse and manual execution of DMVs.

## Comparison with the Traditional Approach

To understand the skill’s real value, it’s worth directly comparing it with the previous diagnostic flow.

### Previous Approach (without the skill)

```sql
-- Step 1: Connect to the warehouse and check active queries
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

-- Step 2: Cross-reference with Query Insights for history
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

-- Step 3: Open the Capacity Metrics app separately
-- and manually correlate timestamps with the events above
```

This flow works, but it requires you to know exactly where to look, have direct access to the warehouse, and still perform the time correlation manually. In environments with high concurrency or multiple warehouses, this scales poorly.

## With the SQL DW Operations Skill

You write in Copilot:

> “Which queries had an execution time above 5 minutes in the last 3 hours? Was there a correlation with capacity spikes in the same period?”

The skill runs the necessary queries, cross-references them with capacity data, and returns a structured summary with the candidate queries, the CU spike timestamps, and the correlation between the two. It also shows the SQL that was executed, which allows you to validate the result.

The difference isn’t just about convenience — it’s about diagnostic speed. In active incidents, every minute counts, and removing the friction of navigating between tools has a direct impact on MTTR (Mean Time to Resolve).

## Practical Example: Investigating a Degradation Window

Let’s simulate a real scenario. Imagine you received a complaint at 4pm that the warehouse was slow. You open Copilot in Fabric and start the investigation.

## Question 1: Identify the exact period of degradation

> “Between 2pm and 4pm today, was there a significant increase in average query execution time on the warehouse?”

The skill queries queryinsights.exec_requests_history, calculates the average total_elapsed_time_ms per 15-minute window, and returns something like:

```
14:00–14:15: avg 1.2s
14:15–14:30: avg 1.4s
14:30–14:45: avg 4.8s ← spike
14:45–15:00: avg 6.1s ← spike
15:00–15:15: avg 2.3s
15:15–16:00: avg 1.1s
```

## Question 2: Identify the queries responsible

> “Which queries were running during the spike between 2:30pm and 3pm? Show me the slowest ones.”

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

The result points, for example, to a full-scan aggregation query on the fact table being executed 12 times during the period — which is unusual.

## Question 3: Correlate with capacity

> “Was there throttling or a CU consumption spike in that same period?”

The skill cross-references with Capacity Metrics and confirms that CU consumption rose to 95% of contracted capacity between 2:35pm and 2:55pm, which explains the increased latency in other concurrent queries.

## Question 4: Understand the root cause

> “Who triggered these queries? Is there a user or application pattern?”

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

Result: an ETL pipeline with a loop bug was firing the same query repeatedly under a specific service principal.

In a traditional flow, this investigation would take 20 to 40 minutes. With the skill, you reach the root cause in under 5 minutes, without leaving Copilot.

---

## Some Limitations That Remain

The SQL DW Operations skill is useful, but it isn’t magic. Some limitations are worth mentioning so you don’t set the wrong expectations.
**1. Dependence on Query Insights being enabled**

The skill relies heavily on Query Insights, which needs to be enabled in the workspace. If query history isn’t being collected, the skill loses much of its historical diagnostic capability.

**2. History retention window**

Query Insights, by default, retains history for 30 days. Investigating older events isn’t possible via the skill without prior data export.

**3. No automatic remediation capability**

The skill is purely diagnostic. It identifies the problem but doesn’t take corrective action, such as cancelling queries, adjusting workload groups, or redistributing load. Remediation is still manual.

**4. Answer quality depends on how specific the question is**

Vague questions produce vague answers. “Is the warehouse slow?” won’t give you the same level of detail as “which queries with error status occurred in the last 2 hours, and what error code was associated with each?” The skill is best used by someone who already has a clear diagnostic mental model and uses Copilot to accelerate execution — not to replace reasoning.

**5. Regional and SKU availability**

Like any Fabric Copilot feature, there’s a dependency on region and capacity SKU. Check whether your F-SKU capacity is in a region where Copilot is enabled.

## Conclusion

The SQL DW Operations skill doesn’t reinvent Data Warehouse diagnostics, but it removes a real friction point that anyone who has ever investigated a performance incident in Fabric knows well: the cost of coordinating multiple tools at once, under pressure, trying to correlate data manually.

What became clear to me analyzing this feature is that the biggest gain isn’t in the sophistication of the AI itself, but in the consolidation of context. Having the three diagnostic sources — Query Insights, Capacity Metrics, and DMVs — accessible through a conversational interface, with transparency into the generated SQL, is a pragmatic and well-executed change.

For teams operating Fabric environments with multiple warehouses and high concurrency, the skill should become part of the incident runbook as the first triage step. It doesn’t replace the technical knowledge of whoever is investigating, but it significantly accelerates reaching the root cause.

The natural next step I’d expect from Microsoft would be adding assisted remediation capability — suggesting query cancellations, recommending workload isolation adjustments, or even creating automatic alerts based on patterns detected by the skill. But as a GA starting point, what’s been delivered is solid and directly addresses a real problem.
