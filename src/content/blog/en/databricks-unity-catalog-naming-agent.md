---
title: 'How to build a naming governance agent for Databricks Unity Catalog'
description: 'Naming conventions are one of those topics every data team agrees on in theory and ignores in practice. The rule exists, the document is in Confluence…'
date: 2026-04-26
tags: ['Databricks', 'Data Engineering']
canonical: 'https://medium.com/@arthurfr23/como-construir-um-agente-de-governan%C3%A7a-de-nomenclatura-para-o-databricks-unity-catalog-138df3a47239'
---

## Introduction

Naming conventions are one of those topics every data team agrees on in theory and ignores in practice. The rule exists, the document is in Confluence, and yet, on Friday at 6 PM, someone creates a table called `df_final_v3_USE_THIS` in production. You know this story.

The problem is not a lack of goodwill. It is that manual naming validation does not scale. When the catalog has hundreds of schemas and thousands of tables, columns, and volumes spread across multiple workspaces, reviewing conventions becomes an audit job that no one has time to do properly. The result is accumulated entropy: inconsistent catalogs that hinder data discovery, break pipelines that depend on predictable patterns, and increase the cognitive cost for any new engineer joining the team.

The solution proposed by Hubert Dudek is direct: an agent that reads the entire catalog, applies your naming rules programmatically, identifies violations, and tells you exactly what needs to be renamed. In this article, I will detail how you can build this kind of agent using Databricks Apps, DABS (Databricks Asset Bundles), Unity Catalog, and Workspace Skills, going through the real technical components and where the truly hard part of the project lies.

## Technical development

## The agent's architecture

The system has four main components that work together:

1. **Unity Catalog as the source of truth**: all the catalog metadata, accessible via `information_schema` or the Unity Catalog REST API

2. **Rules engine**: where the validation logic lives, the heart of the system

3. **Databricks Apps**: presentation and user-interaction layer

4. **DABS**: packaging and deployment of the agent as reproducible infrastructure

## Reading the catalog with Unity Catalog

Unity Catalog exposes the entire catalog structure through `information_schema`. To read objects from a specific catalog, you can use SQL directly:

```sql
-- Lists all schemas of a catalog
SELECT catalog_name, schema_name
FROM system.information_schema.schemata
WHERE catalog_name = 'my_catalog';

-- Lists all tables with their schemas
SELECT table_catalog, table_schema, table_name, table_type
FROM system.information_schema.tables
WHERE table_catalog = 'my_catalog';

-- Lists all columns
SELECT table_catalog, table_schema, table_name, column_name, data_type
FROM system.information_schema.columns
WHERE table_catalog = 'my_catalog';
```

In Python, via the Databricks SDK or `databricks.sdk`:

```python
from databricks.sdk import WorkspaceClient
w = WorkspaceClient()
# Lists all catalogs
catalogs = list(w.catalogs.list())
# Lists schemas of a catalog
schemas = list(w.schemas.list(catalog_name="my_catalog"))
# Lists tables of a schema
tables = list(w.tables.list(catalog_name="my_catalog", schema_name="my_schema"))
```

This gives you programmatic access to the entire hierarchy: catalogs, schemas, tables, columns, volumes, and functions.

## The rules engine: here is the real work

Hubert was blunt: "the hardest part was writing the rules." This is honest and deserves attention.

Naming rules seem simple until you try to formalize them. Consider what seems obvious, like "tables must use snake_case", and you quickly realize you need to define what a violation is:

```
- `MySales` is a violation (PascalCase)
- `my-sales` is a violation (kebab-case)
- `MY_SALES` is a violation? It depends on your standard
- `my_sales_2024` is valid? And `my_sales_2024_v2`?
```

A robust rules engine needs at least three layers:

**1. Structural rules** (name format):

```python
import re
from dataclasses import dataclass
from typing import Optional

@dataclass
class NamingViolation:
    object_type: str  # catalog, schema, table, column
    full_name: str
    rule_violated: str
    suggestion: Optional[str] = None

def check_snake_case(name: str) -> bool:
    """Validates snake_case: only lowercase letters, numbers, and underscores."""
    return bool(re.match(r'^[a-z][a-z0-9_]*$', name))

def check_no_double_underscores(name: str) -> bool:
    return '__' not in name

def check_max_length(name: str, max_len: int = 64) -> bool:
    return len(name) <= max_len

def check_no_reserved_words(name: str, reserved: set) -> bool:
    return name.lower() not in reserved

RESERVED_WORDS = {'select', 'from', 'table', 'schema', 'drop', 'delete', 'insert'}
```

**2. Semantic rules** (meaning and context):

```python
def check_table_prefix(table_name: str, schema_name: str) -> bool:
    """
    Example: tables in the 'raw' schema must start with 'raw_'.
    Adapt according to your layer convention (bronze/silver/gold, etc).
    """
    layer_prefixes = {
        'raw': 'raw_',
        'bronze': 'brz_',
        'silver': 'slv_',
        'gold': 'gld_',
        'mart': 'mrt_',
    }
    expected_prefix = layer_prefixes.get(schema_name)
    if expected_prefix:
        return table_name.startswith(expected_prefix)
    return True

def check_column_type_suffix(column_name: str, data_type: str) -> bool:
    """
    Date columns must end in _date or _dt.
    Timestamp columns must end in _at or _timestamp.
    """
    type_suffix_rules = {
        'DATE': ('_date', '_dt'),
        'TIMESTAMP': ('_at', '_timestamp', '_ts'),
        'BOOLEAN': ('_flag', '_is_', '_has_'),
    }
    suffixes = type_suffix_rules.get(data_type.upper())
    if suffixes:
        return any(column_name.endswith(s) or column_name.startswith(s) for s in suffixes)
    return True
```

**3. Organizational rules** (consistency between related objects):

```python
def validate_table(table_name: str, schema_name: str, catalog_name: str) -> list[NamingViolation]:
    violations = []
    full_name = f"{catalog_name}.{schema_name}.{table_name}"

    if not check_snake_case(table_name):
        violations.append(NamingViolation(
            object_type="table",
            full_name=full_name,
            rule_violated="snake_case_required",
            suggestion=to_snake_case(table_name)
        ))

    if not check_table_prefix(table_name, schema_name):
        expected = get_expected_prefix(schema_name)
        violations.append(NamingViolation(
            object_type="table",
            full_name=full_name,
            rule_violated=f"missing_layer_prefix",
            suggestion=f"{expected}{table_name}"
        ))

    return violations

def to_snake_case(name: str) -> str:
    """Converts PascalCase or camelCase to snake_case."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
```

## Integrating with Workspace Skills (LLM in the loop)

The differentiator of using Workspace Skills is that you can invoke a language model to suggest smarter corrections, especially for ambiguous cases. Instead of a regex that suggests `my_table_v2` back, the LLM can infer the context and propose `mrt_monthly_sales` based on the schema and the content.

```python
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.serving import ChatMessage, ChatMessageRole

def suggest_rename_with_llm(
    object_name: str,
    object_type: str,
    context: dict,
    violations: list[str]
) -> str:
    w = WorkspaceClient()

    prompt = f"""
You are a data governance expert. 
Analyze the object below and suggest a corrected name following the conventions.

Object: {object_type} '{object_name}'
Schema: {context.get('schema', 'unknown')}
Identified violations: {', '.join(violations)}
Team conventions:
- snake_case required
- Layer prefixes: brz_ (bronze), slv_ (silver), gld_ (gold), mrt_ (mart)
- Date columns end in _date
- No ambiguous abbreviations

Respond only with the suggested name, no explanations.
"""

    response = w.serving_endpoints.query(
        name="databricks-meta-llama-3-1-70b-instruct",
        messages=[ChatMessage(role=ChatMessageRole.USER, content=prompt)]
    )

    return response.choices[0].message.content.strip()
```

## Deploy with DABS

The Databricks Asset Bundle packages everything as versioned infrastructure. The basic structure of the bundle:

```yaml
# databricks.yml
bundle:
  name: naming-convention-agent

resources:
  jobs:
    catalog_audit_job:
      name: "Catalog Naming Audit"
      schedule:
        quartz_cron_expression: "0 0 8 * * ?"
        timezone_id: "America/Sao_Paulo"
      tasks:
        - task_key: run_audit
          notebook_task:
            notebook_path: ./notebooks/run_audit.py
          job_cluster_key: audit_cluster

  apps:
    naming_agent_app:
      name: "naming-convention-agent"
      source_code_path: ./app

targets:
  dev:
    mode: development
    default: true
  prod:
    mode: production
```

Databricks Apps serves as the web interface where engineers can see the violations report, filter by catalog or schema, and copy the automatically generated rename commands.

## Practical example: running the full audit

```python
from databricks.sdk import WorkspaceClient
from typing import Generator

def audit_catalog(catalog_name: str) -> Generator[NamingViolation, None, None]:
    w = WorkspaceClient()

    # Iterates over schemas
    for schema in w.schemas.list(catalog_name=catalog_name):
        schema_name = schema.name

        if not check_snake_case(schema_name):
            yield NamingViolation(
                object_type="schema",
                full_name=f"{catalog_name}.{schema_name}",
                rule_violated="snake_case_required",
                suggestion=to_snake_case(schema_name)
            )

        # Iterates over tables within the schema
        for table in w.tables.list(catalog_name=catalog_name, schema_name=schema_name):
            table_name = table.name

            violations = validate_table(table_name, schema_name, catalog_name)
            yield from violations

            # Iterates over columns
            full_table = w.tables.get(f"{catalog_name}.{schema_name}.{table_name}")
            if full_table.columns:
                for col in full_table.columns:
                    if not check_snake_case(col.name):
                        yield NamingViolation(
                            object_type="column",
                            full_name=f"{catalog_name}.{schema_name}.{table_name}.{col.name}",
                            rule_violated="snake_case_required",
                            suggestion=to_snake_case(col.name)
                        )

# Running it and generating the report
violations = list(audit_catalog("production"))
print(f"Total violations found: {len(violations)}")

# Generating rename commands
for v in violations:
    if v.object_type == "table" and v.suggestion:
        parts = v.full_name.split(".")
        print(f"ALTER TABLE {v.full_name} RENAME TO {parts[0]}.{parts[1]}.{v.suggestion};")
```

The output is a list of SQL commands ready for execution, with the exact rename that needs to happen. The engineer reviews, approves, and runs it. No subjective judgment, no pull-request discussion about whether `VIPCustomer` should be `vip_customer` or `vip_customers`.

## Conclusion

Hubert's project solves a real problem with a pragmatic approach: do not try to convince people to follow conventions manually, automate the detection and generate the corrections. The chosen stack (Unity Catalog, Databricks Apps, DABS, and an LLM via Workspace Skills) makes sense because it keeps everything inside the Databricks ecosystem, reduces adoption friction, and allows reproducible deployment.

The most honest lesson here is that the technology is the easy part. The rules engine, which seems simple, is where you will spend most of your time, because formalizing what seems obvious reveals ambiguities your team has never explicitly discussed. Before writing a single line of code, sit down with the team and document the rules with real edge cases.

Limitations also exist: renaming tables in production has implications for downstream jobs, dashboards, and APIs that consume those objects. The agent detects and suggests, but execution needs a careful migration strategy, especially in environments where there is no full control over all consumers. For large catalogs with a long history, it is wise to prioritize violations by impact and tackle them incrementally.

The natural next step is to integrate this audit into CI/CD via DABS, blocking the creation of new objects that violate conventions before they even reach the production catalog. Reactive governance is better than none, but preventive governance is where the cost of correction really drops.

Dudek's original article:

[Implementing Enterprise Naming Convention, Agentic Way](https://databrickster.medium.com/implementing-enterprise-naming-convention-agentic-way-3d1df7f5aef6)
