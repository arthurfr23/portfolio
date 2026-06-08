---
title: 'Databricks Apps: construindo aplicações de dados sem sair do Lakehouse'
description: 'Por muito tempo, o ciclo de vida de um projeto de dados tinha uma divisão bem clara: você construía seus pipelines, transformações e modelos dentro de…'
date: 2026-05-04
tags: ['Databricks', 'Data Engineering', 'Data Science']
canonical: 'https://medium.com/@arthurfr23/databricks-apps-construindo-aplica%C3%A7%C3%B5es-de-dados-sem-sair-do-lakehouse-d8c316e0f33d'
---

Por muito tempo, o ciclo de vida de um projeto de dados tinha uma divisão bem clara: você construía seus pipelines, transformações e modelos dentro de uma plataforma como o Databricks, e quando chegava a hora de expor os resultados para usuários finais ou criar alguma interface interativa, precisava sair dali. Streamlit rodando em uma VM no Azure, Gradio no EC2, um Flask qualquer atrás de um Nginx, tudo isso gerenciado separadamente, com infraestrutura própria, autenticação separada, segredos espalhados em vários lugares. O trabalho dobrava logo depois que o modelo ficava pronto.

Essa fricção nunca foi trivial. Engenheiros de dados passavam a maior parte do tempo dentro do Databricks, com acesso direto ao Unity Catalog, aos modelos registrados no MLflow, às tabelas Delta. Mas na hora de transformar isso em algo consumível, era preciso atravessar uma fronteira técnica e operacional que custava tempo, aumentava a superfície de ataque de segurança e criava dependências novas. Não é exagero dizer que muitos projetos de dados morreram ou ficaram presos em dashboards estáticos por falta de uma caminho direto para a construção de aplicações.

O Databricks viu esse gap e respondeu com o **Databricks Apps**, uma funcionalidade que chegou em preview em 2024 e que propõe exatamente isso: deixar você criar, hospedar e gerenciar aplicações de dados diretamente dentro do ambiente Databricks, com autenticação, permissões e acesso aos dados já resolvidos pelo próprio Unity Catalog e pelo Databricks Identity.

## O que é o Databricks Apps e como ele funciona

O Databricks Apps é uma camada de hospedagem de aplicações web construída sobre o Databricks Workspace. A ideia central é simples: você escreve uma aplicação Python, usando frameworks como Streamlit, Gradio, Dash ou mesmo uma API com FastAPI, e faz o deploy direto no workspace. O Databricks cuida do runtime, do roteamento, da autenticação com SSO e do acesso controlado aos recursos da plataforma.

Por baixo, o App roda em um contêiner isolado dentro do ambiente Databricks, com um service principal dedicado. Esse service principal pode receber permissões granulares no Unity Catalog, o que significa que a aplicação acessa exatamente os dados que você permitir, sem precisar distribuir tokens ou connection strings. Toda a gestão de identidade e acesso já é herdada do workspace.

O ciclo de desenvolvimento é bem direto:

```
1. Você cria um App no workspace, via UI ou Terraform.
2. Faz upload do código (ou conecta via Databricks CLI e Git).
3. Define as variáveis de ambiente e os recursos que o App precisa acessar (SQL Warehouses, modelos no Model Serving, segredos no Secret Store).
4. O Databricks provisiona o ambiente e expõe uma URL pública autenticada.
```

A URL gerada já está protegida pelo SSO do workspace. Qualquer usuário que tentar acessar precisa ter permissão explícita no App, seguindo o mesmo modelo de controle de acesso que você já usa para notebooks e clusters.

## Por que isso importa na prática

A promessa de “tudo em um lugar” já foi feita muitas vezes na indústria de dados, mas o Databricks Apps tem algumas características que tornam isso mais concreto do que o habitual.

- **Eliminação de infraestrutura paralela.**

Antes, hospedar um Streamlit em produção significava lidar com uma VM ou Kubernetes, configurar HTTPS, integrar com o identity provider da empresa, gerenciar secrets de acesso ao banco ou warehouse. Agora, tudo isso já existe no workspace. O ganho em simplicidade operacional é real, especialmente para times pequenos ou projetos de menor escala onde esse overhead é desproporcional.

- **Acesso nativo a SQL Warehouses e Model Serving.**

Dentro de um Databricks App, você pode usar o SDK do Databricks para se conectar a um SQL Warehouse sem precisar de credenciais explícitas. O runtime injeta automaticamente as variáveis de ambiente `DATABRICKS_HOST` e `DATABRICKS_TOKEN` com um token de curta duração do service principal do App. Isso elimina uma das maiores fontes de problema em aplicações de dados: a gestão de credenciais em produção.

```python
import streamlit as st
from databricks import sql
import os

def get_connection():
    return sql.connect(
        server_hostname=os.environ["DATABRICKS_HOST"],
        http_path="/sql/1.0/warehouses/seu_warehouse_id",
        access_token=os.environ["DATABRICKS_TOKEN"]
    )

@st.cache_data(ttl=300)
def load_vendas_por_regiao():
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    regiao,
                    SUM(valor_venda) AS total_vendas,
                    COUNT(*) AS num_pedidos
                FROM catalog_prod.vendas.fato_pedidos
                WHERE data_pedido >= CURRENT_DATE - INTERVAL 30 DAYS
                GROUP BY regiao
                ORDER BY total_vendas DESC
            """)
            return cursor.fetchall_arrow().to_pandas()

st.title("Painel de Vendas por Região")
df = load_vendas_por_regiao()
st.bar_chart(df.set_index("regiao")["total_vendas"])
```

Esse código funciona em produção dentro de um Databricks App sem nenhuma variável de ambiente configurada manualmente. O token é injetado automaticamente pelo runtime.

- **Integração com Model Serving.**

Se você tem um modelo registrado no Unity Catalog e servido via Databricks Model Serving, chamar esse endpoint dentro de um App é igualmente direto:

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

Não há necessidade de gerar tokens de API externos, configurar CORS ou lidar com políticas de rede separadas. O App já está dentro do perímetro do workspace.

## Um exemplo prático

Um caso de uso que funciona muito bem é criar uma aplicação interna onde analistas de negócio podem explorar dados sem precisar de acesso direto ao SQL Warehouse. Você define o que o App pode acessar, e o usuário final interage apenas pela interface.

```python
import streamlit as st
import pandas as pd
from databricks import sql
import os

WAREHOUSE_HTTP_PATH = "/sql/1.0/warehouses/abc123def456"

@st.cache_data(ttl=600)
def listar_tabelas_disponiveis() -> list[str]:
    with sql.connect(
        server_hostname=os.environ["DATABRICKS_HOST"],
        http_path=WAREHOUSE_HTTP_PATH,
        access_token=os.environ["DATABRICKS_TOKEN"]
    ) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES IN catalog_prod.gold")
            rows = cursor.fetchall()
            return [row[1] for row in rows]

def executar_query(tabela: str, limite: int) -> pd.DataFrame:
    query = f"SELECT * FROM catalog_prod.gold.{tabela} LIMIT {limite}"
    with sql.connect(
        server_hostname=os.environ["DATABRICKS_HOST"],
        http_path=WAREHOUSE_HTTP_PATH,
        access_token=os.environ["DATABRICKS_TOKEN"]
    ) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            return cursor.fetchall_arrow().to_pandas()

st.set_page_config(page_title="Explorador de Dados - Gold Layer", layout="wide")
st.title("Explorador da Camada Gold")

tabelas = listar_tabelas_disponiveis()
tabela_selecionada = st.selectbox("Selecione a tabela", tabelas)
limite = st.slider("Número de linhas", min_value=10, max_value=1000, value=100, step=10)

if st.button("Carregar dados"):
    with st.spinner("Executando consulta..."):
        df = executar_query(tabela_selecionada, limite)
    st.dataframe(df, use_container_width=True)
    st.caption(f"{len(df)} linhas carregadas de `catalog_prod.gold.{tabela_selecionada}`")
```

Para fazer o deploy, você pode usar o Databricks CLI:

```bash
databricks apps create explorador-gold \
  --description "Interface de exploração da camada gold para analistas"

databricks apps deploy explorador-gold \
  --source-code-path ./app
```

E para definir os recursos que o App pode acessar, você configura no arquivo `app.yaml`:

```yaml
command: ["streamlit", "run", "app.py", "--server.port", "8080"]

resources:
  - name: "warehouse-gold"
    description: "SQL Warehouse para queries na gold layer"
    resource_type: "sql_warehouse"
    sql_warehouse:
      id: "abc123def456"
      permission: "CAN_USE"
```

## O que fica de aprendizado

O Databricks Apps representa uma mudança de posicionamento relevante do Databricks: a plataforma não quer ser apenas onde os dados são processados, mas também onde os produtos de dados são entregues. É uma aposta clara no valor de manter o ciclo completo dentro do mesmo ambiente, com governança unificada e sem a necessidade de montar infraestrutura paralela para a última milha.

Na prática, a funcionalidade ainda tem limitações. O controle sobre o ambiente de execução é reduzido comparado a um deploy próprio, a capacidade de customizar o comportamento do servidor web é limitada, e para aplicações com requisitos de escalabilidade mais sofisticados você vai sentir as bordas da plataforma. A documentação ainda está amadurecendo em alguns pontos, especialmente sobre comportamento em edge cases de autenticação e gestão de recursos simultâneos.

Mas para o caso de uso que ele se propõe a resolver, que é reduzir a distância entre onde os dados vivem e onde os usuários os consomem, ele entrega. Se você já vive dentro do Databricks para construir pipelines e modelos, criar uma interface interativa sem sair do workspace é uma proposta difícil de ignorar. Vale incorporar no repertório, especialmente para projetos internos onde velocidade de entrega importa mais do que controle granular de infraestrutura.
