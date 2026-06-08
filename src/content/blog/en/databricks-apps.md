---
title: 'Databricks Apps: building data applications without leaving the Lakehouse'
description: 'For a long time, the lifecycle of a data project had a very clear split: you built your pipelines, transformations, and models inside a platform like…'
date: 2026-05-04
tags: ['Databricks', 'Data Engineering', 'Data Science']
canonical: 'https://medium.com/@arthurfr23/databricks-apps-construindo-aplica%C3%A7%C3%B5es-de-dados-sem-sair-do-lakehouse-d8c316e0f33d'
---

For a long time, the lifecycle of a data project had a very clear split: you built your pipelines, transformations, and models inside a platform like Databricks, and when the time came to expose the results to end users or create some interactive interface, you had to leave it. Streamlit running on a VM in Azure, Gradio on EC2, some Flask app behind an Nginx, all managed separately, with its own infrastructure, separate authentication, secrets scattered across several places. The work doubled right after the model was ready.

This friction was never trivial. Data engineers spent most of their time inside Databricks, with direct access to Unity Catalog, to models registered in MLflow, to Delta tables. But when it came to turning this into something consumable, you had to cross a technical and operational boundary that cost time, increased the security attack surface, and created new dependencies. It is not an exaggeration to say that many data projects died or got stuck in static dashboards for lack of a direct path to building applications.

Databricks saw this gap and responded with **Databricks Apps**, a feature that arrived in preview in 2024 and proposes exactly this: letting you create, host, and manage data applications directly inside the Databricks environment, with authentication, permissions, and data access already resolved by Unity Catalog and Databricks Identity themselves.

## What Databricks Apps is and how it works

Databricks Apps is a web application hosting layer built on top of the Databricks Workspace. The central idea is simple: you write a Python application, using frameworks like Streamlit, Gradio, Dash, or even an API with FastAPI, and deploy it directly to the workspace. Databricks takes care of the runtime, routing, SSO authentication, and controlled access to the platform's resources.

Underneath, the App runs in an isolated container inside the Databricks environment, with a dedicated service principal. This service principal can be granted granular permissions in Unity Catalog, which means the application accesses exactly the data you allow, without having to distribute tokens or connection strings. All identity and access management is already inherited from the workspace.

The development cycle is quite direct:

```
1. You create an App in the workspace, via UI or Terraform.
2. Upload the code (or connect via the Databricks CLI and Git).
3. Define the environment variables and the resources the App needs to access (SQL Warehouses, models in Model Serving, secrets in the Secret Store).
4. Databricks provisions the environment and exposes an authenticated public URL.
```

The generated URL is already protected by the workspace SSO. Any user trying to access it must have explicit permission on the App, following the same access-control model you already use for notebooks and clusters.

## Why this matters in practice

The "everything in one place" promise has been made many times in the data industry, but Databricks Apps has some characteristics that make it more concrete than usual.

- **Elimination of parallel infrastructure.**

Before, hosting a Streamlit app in production meant dealing with a VM or Kubernetes, configuring HTTPS, integrating with the company's identity provider, managing secrets for accessing the database or warehouse. Now, all of this already exists in the workspace. The gain in operational simplicity is real, especially for small teams or smaller-scale projects where this overhead is disproportionate.

- **Native access to SQL Warehouses and Model Serving.**

Inside a Databricks App, you can use the Databricks SDK to connect to a SQL Warehouse without needing explicit credentials. The runtime automatically injects the `DATABRICKS_HOST` and `DATABRICKS_TOKEN` environment variables with a short-lived token from the App's service principal. This eliminates one of the biggest sources of problems in data applications: credential management in production.

```python
import streamlit as st
from databricks import sql
import os

def get_connection():
    return sql.connect(
        server_hostname=os.environ["DATABRICKS_HOST"],
        http_path="/sql/1.0/warehouses/your_warehouse_id",
        access_token=os.environ["DATABRICKS_TOKEN"]
    )

@st.cache_data(ttl=300)
def load_sales_by_region():
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    region,
                    SUM(sale_amount) AS total_sales,
                    COUNT(*) AS num_orders
                FROM catalog_prod.sales.fact_orders
                WHERE order_date >= CURRENT_DATE - INTERVAL 30 DAYS
                GROUP BY region
                ORDER BY total_sales DESC
            """)
            return cursor.fetchall_arrow().to_pandas()

st.title("Sales by Region Dashboard")
df = load_sales_by_region()
st.bar_chart(df.set_index("region")["total_sales"])
```

This code works in production inside a Databricks App without any environment variable configured manually. The token is injected automatically by the runtime.

- **Integration with Model Serving.**

If you have a model registered in Unity Catalog and served via Databricks Model Serving, calling that endpoint inside an App is equally direct:

```python
import mlflow.deployments
import os

client = mlflow.deployments.get_deploy_client("databricks")

def predict(input_data: dict) -> dict:
    response = client.predict(
        endpoint="endpoint-churn-model-v2",
        inputs={"dataframe_records": [input_data]}
    )
    return response["predictions"][0]
```

There is no need to generate external API tokens, configure CORS, or deal with separate network policies. The App is already inside the workspace perimeter.

## A practical example

A use case that works very well is creating an internal application where business analysts can explore data without needing direct access to the SQL Warehouse. You define what the App can access, and the end user interacts only through the interface.

```python
import streamlit as st
import pandas as pd
from databricks import sql
import os

WAREHOUSE_HTTP_PATH = "/sql/1.0/warehouses/abc123def456"

@st.cache_data(ttl=600)
def list_available_tables() -> list[str]:
    with sql.connect(
        server_hostname=os.environ["DATABRICKS_HOST"],
        http_path=WAREHOUSE_HTTP_PATH,
        access_token=os.environ["DATABRICKS_TOKEN"]
    ) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES IN catalog_prod.gold")
            rows = cursor.fetchall()
            return [row[1] for row in rows]

def run_query(table: str, limit: int) -> pd.DataFrame:
    query = f"SELECT * FROM catalog_prod.gold.{table} LIMIT {limit}"
    with sql.connect(
        server_hostname=os.environ["DATABRICKS_HOST"],
        http_path=WAREHOUSE_HTTP_PATH,
        access_token=os.environ["DATABRICKS_TOKEN"]
    ) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchall_arrow().to_pandas()

st.set_page_config(page_title="Data Explorer - Gold Layer", layout="wide")
st.title("Gold Layer Explorer")

tables = list_available_tables()
selected_table = st.selectbox("Select the table", tables)
limit = st.slider("Number of rows", min_value=10, max_value=1000, value=100, step=10)

if st.button("Load data"):
    with st.spinner("Running query..."):
        df = run_query(selected_table, limit)
    st.dataframe(df, use_container_width=True)
    st.caption(f"{len(df)} rows loaded from `catalog_prod.gold.{selected_table}`")
```

To deploy, you can use the Databricks CLI:

```bash
databricks apps create gold-explorer \
  --description "Gold layer exploration interface for analysts"

databricks apps deploy gold-explorer \
  --source-code-path ./app
```

And to define the resources the App can access, you configure the `app.yaml` file:

```yaml
command: ["streamlit", "run", "app.py", "--server.port", "8080"]

resources:
  - name: "warehouse-gold"
    description: "SQL Warehouse for queries on the gold layer"
    resource_type: "sql_warehouse"
    sql_warehouse:
      id: "abc123def456"
      permission: "CAN_USE"
```

## The takeaway

Databricks Apps represents a relevant positioning shift for Databricks: the platform does not want to be just where the data is processed, but also where the data products are delivered. It is a clear bet on the value of keeping the full cycle within the same environment, with unified governance and without the need to set up parallel infrastructure for the last mile.

In practice, the feature still has limitations. Control over the execution environment is reduced compared to your own deployment, the ability to customize the web server's behavior is limited, and for applications with more sophisticated scalability requirements you will feel the edges of the platform. The documentation is still maturing in some areas, especially around behavior in edge cases of authentication and management of concurrent resources.

But for the use case it sets out to solve, which is reducing the distance between where the data lives and where users consume it, it delivers. If you already live inside Databricks to build pipelines and models, creating an interactive interface without leaving the workspace is a proposition that is hard to ignore. It is worth adding to the repertoire, especially for internal projects where delivery speed matters more than granular infrastructure control.
