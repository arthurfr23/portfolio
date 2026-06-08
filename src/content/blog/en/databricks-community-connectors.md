---
title: 'Community Connectors in Databricks'
description: 'If you have ever worked with data ingestion at scale, you know that a considerable part of the effort is not in transformation or modeling, but in…'
date: 2026-06-01
tags: ['Data Engineering', 'Databricks']
canonical: 'https://medium.com/@arthurfr23/community-connectors-no-databricks-fc04a5bf048e'
---

If you have ever worked with data ingestion at scale, you know that a considerable part of the effort is not in transformation or modeling, but in simply getting the data into the platform. Proprietary APIs, specific authentications, exotic formats, SaaS SDKs that change without warning, and an endless list of connectors that either do not exist, or are too expensive, or depend on a third-party vendor like Fivetran and Airbyte to work.

Databricks has always positioned itself as a platform built on top of open source, but the ingestion layer was, in practice, a weak point. You had Delta Lake, Unity Catalog, Spark, all open and extensible, but when you needed to connect to a legacy system or a niche SaaS, the options were few. Either you wrote it from scratch, or you paid for an external tool.

The arrival of **Community Connectors** changes this scenario structurally. For the first time, anyone can build and publish a connector for the Databricks ecosystem. This is not a product detail, it is a change of model. And understanding what is being opened up here, what it implies for data teams, and what the real limits of this proposal are, is what I will do in this article.

## What Community Connectors are and how they work

Community Connectors are connectors built by external developers, SaaS companies, and the community itself, that follow an open specification defined by Databricks. The idea is analogous to what Airbyte did with its open-source connector model, but now natively integrated into the platform.

The architecture behind it relies on **Databricks Lakeflow Connect,** which is the official native ingestion framework. The connectors follow an interface contract that guarantees compatibility with Unity Catalog, support for incremental streaming, and schema management.

From a technical standpoint, a connector basically needs to implement three responsibilities:

1. **Authentication and connection** to the data source

2. **Incremental extraction**, respecting watermarks or cursors

3. **Data delivery** in a Delta-compatible format, including schema metadata

Databricks publishes the SDK needed to build these connectors, and once published in the Marketplace, the connector becomes available to any workspace running the compatible version of the platform.

## Why this is different from simply using Airbyte or Fivetran

This is the question that will come up in any serious conversation on the topic. We already have mature ingestion tools with hundreds of connectors. Why import this model into Databricks?

The answer has a few layers.

1. **Native integration with Unity Catalog.**

When you use an external connector, the data arrives in an S3 or ADLS bucket, and then you have to register, catalog, and apply governance policies manually, or trust that the external tool respects your rules. With Community Connectors, ingestion is born inside Unity Catalog. Lineage, permissions, auditing, everything is available from the first byte.

**2. No extra orchestration layer.**

Fivetran and Airbyte need their own infrastructure, their own scheduler, their own monitoring. With native ingestion, you orchestrate via Databricks Workflows, centralize logs in the same place, and reduce the number of systems you have to operate.

**3. Data transfer cost.**

Depending on the architecture, data flowing through an intermediary tool generates unnecessary egress costs. Native ingestion can eliminate this overhead.

**4. Open contribution model.**

Here is the real differentiator. Fivetran has proprietary connectors. Airbyte has open-source connectors, but the platform itself is a separate layer. Databricks is saying: the platform is yours, and now the connectors can be yours too, published directly in the ecosystem where the data will live.

The honest downside is that the connector ecosystem is still just starting. Airbyte and Fivetran have years of maturity, documented edge cases, and active communities around each connector. Community Connectors will take time to reach that density.

## Practical example: basic structure of a custom connector

Even though the full specification is evolving, it is already possible to understand the expected structure. Below is a Python skeleton that represents how a simple connector would be organized:

```python
from databricks.sdk import WorkspaceClient
from databricks.lakeflow.connectors import ConnectorBase, SourceConfig, IncrementalCursor

class MyApiConnector(ConnectorBase):
    """
    Example connector for a generic REST API.
    """

    def __init__(self, config: SourceConfig):
        self.base_url = config.get("base_url")
        self.api_key = config.get("api_key")
        self.cursor = IncrementalCursor(field="updated_at")

    def authenticate(self) -> bool:
        """Validates credentials before starting the extraction."""
        import requests
        response = requests.get(
            f"{self.base_url}/health",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return response.status_code == 200

    def extract(self, since: str = None):
        """
        Extracts incremental records from a date cursor.
        Returns a generator of dictionaries.
        """
        import requests

        params = {"page": 1, "page_size": 500}
        if since:
            params["updated_after"] = since

        while True:
            response = requests.get(
                f"{self.base_url}/records",
                headers={"Authorization": f"Bearer {self.api_key}"},
                params=params
            ).json()

            records = response.get("data", [])
            if not records:
                break

            for record in records:
                yield record

            if not response.get("has_next_page"):
                break

            params["page"] += 1

    def get_schema(self) -> dict:
        """
        Returns the expected schema for Unity Catalog.
        Databricks uses this to create or evolve the destination table.
        """
        return {
            "id": "string",
            "name": "string",
            "updated_at": "timestamp",
            "payload": "string"
        }
```

And on the configuration side, via Databricks Workflows, you would wire it up like this:

```python
# Example of how to register and trigger the connector via the SDK
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()

# Creating an ingestion pipeline using the registered connector
pipeline_config = {
    "name": "ingestion_my_api",
    "connector": "community/my_api_connector",
    "destination": {
        "catalog": "main",
        "schema": "raw",
        "table": "my_api_records"
    },
    "schedule": "0 */2 * * *",  # every 2 hours
    "config": {
        "base_url": "https://api.myservice.com/v1",
        "api_key": "{{secrets/my_scope/api_key}}"
    }
}

w.lakeflow.pipelines.create(**pipeline_config)
```

The important point here is the separation of responsibilities: the connector knows how to extract, Databricks knows where to store and how to govern. You do not need to write a single line of code to deal with Delta, partitioning, or schema control. That stays with the platform.

## In short…

Community Connectors represent an important philosophical shift in Databricks. The platform is recognizing that it cannot, on its own, cover the full diversity of data sources that teams need, and it is opening up the model so the community can solve this. It is the same bet that worked with Delta Lake, with MLflow, and with Spark, and there are good reasons to believe it will work here too.

For teams that are already all-in on Databricks and suffer from the dependency on external ingestion tools, it is worth following the evolution of this ecosystem closely. If you have an internal SaaS or a legacy system that no one has connected yet, this is the right moment to be an early contributor and gain visibility in the ecosystem.

The immediate step is to dive into the Lakeflow Connect documentation, explore the connector SDK, and evaluate whether any source you use today is a candidate for a community connector. The simplest contribution, a well-documented working connector, can generate disproportionate value for the entire community.
