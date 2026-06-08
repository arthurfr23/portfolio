---
title: 'Community Connectors no Databricks'
description: 'Se você já trabalhou com ingestão de dados em escala, sabe que uma parte considerável do esforço não está na transformação ou na modelagem, mas em…'
date: 2026-06-01
tags: ['Data Engineering', 'Databricks']
canonical: 'https://medium.com/@arthurfr23/community-connectors-no-databricks-fc04a5bf048e'
---

Se você já trabalhou com ingestão de dados em escala, sabe que uma parte considerável do esforço não está na transformação ou na modelagem, mas em simplesmente conseguir trazer os dados para dentro da plataforma. APIs proprietárias, autenticações específicas, formatos exóticos, SDKs de SaaS que mudam sem aviso, e uma lista interminável de conectores que ou não existem, ou custam caro demais, ou dependem de um vendor de terceiros como Fivetran e Airbyte para funcionar.

O Databricks sempre se posicionou como uma plataforma construída sobre open-source, mas a camada de ingestão era, na prática, um ponto fraco. Você tinha o Delta Lake, o Unity Catalog, o Spark, tudo aberto e extensível, mas quando precisava conectar com um sistema legado ou um SaaS de nicho, as opções eram poucas. Ou você escrevia do zero, ou pagava por uma ferramenta externa.

A novidade dos **Community Connectors** muda esse cenário de forma estrutural. Pela primeira vez, qualquer pessoa pode construir e publicar um conector para o ecossistema do Databricks. Isso não é um detalhe de produto, é uma mudança de modelo. E entender o que está sendo aberto aqui, o que isso implica para times de dados e quais são os limites reais dessa proposta, é o que vou fazer neste artigo.

## O que são os Community Connectors e como funcionam

Os Community Connectors são conectores construídos por desenvolvedores externos, empresas de SaaS e pela própria comunidade, que seguem uma especificação aberta definida pelo Databricks. A ideia é análoga ao que o Airbyte fez com seu modelo de conectores open-source, mas agora integrado nativamente à plataforma.

A arquitetura por trás disso se apoia no **Databricks Lakeflow Connect,** que é o framework oficial de ingestão nativa. Os conectores seguem um contrato de interface que garante compatibilidade com o Unity Catalog, suporte a streaming incremental e gerenciamento de schema.

Do ponto de vista técnico, um conector precisa implementar basicamente três responsabilidades:

1. **Autenticação e conexão** com a fonte de dados

2. **Extração incremental**, respeitando watermarks ou cursors

3. **Entrega dos dados** em formato compatível com Delta, incluindo metadados de schema

O Databricks publica o SDK necessário para construir esses conectores, e uma vez publicado no Marketplace, o conector fica disponível para qualquer workspace que use a versão compatível da plataforma.

## Por que isso é diferente de simplesmente usar Airbyte ou Fivetran

Essa é a pergunta que vai aparecer em qualquer conversa séria sobre o tema. Já temos ferramentas maduras de ingestão com centenas de conectores. Por que importar esse modelo para dentro do Databricks?

A resposta tem algumas camadas.

1. **Integração nativa com Unity Catalog.**

Quando você usa um conector externo, os dados chegam em um bucket S3 ou ADLS, e aí você precisa registrar, catalogar e aplicar as políticas de governança manualmente, ou confiar que a ferramenta externa respeite suas regras. Com os Community Connectors, a ingestão já nasce dentro do Unity Catalog. Lineage, permissões, auditoria, tudo está disponível desde o primeiro byte.

**2. Sem camada de orquestração extra.**

Fivetran e Airbyte precisam de sua própria infraestrutura, seu próprio scheduler, seu próprio monitoramento. Com ingestão nativa, você orquestra via Databricks Workflows, centraliza logs no mesmo lugar e reduz o número de sistemas que precisa operar.

**3. Custo de transferência de dados.**

Dependendo da arquitetura, os dados passando por uma ferramenta intermediária geram egress costs desnecessários. Ingestão nativa pode eliminar esse overhead.

**4. Modelo de contribuição aberto.**

Aqui está o diferencial real. O Fivetran tem conectores proprietários. O Airbyte tem conectores open-source, mas a plataforma em si é uma camada separada. O Databricks está dizendo: a plataforma é sua, e agora os conectores também podem ser seus, publicados diretamente no ecossistema onde os dados vão viver.

A desvantagem honesta é que o ecossistema de conectores ainda está começando. Airbyte e Fivetran têm anos de maturidade, casos de borda documentados e comunidades ativas em torno de cada conector. Os Community Connectors vão levar tempo para atingir essa densidade.

## Exemplo prático: estrutura básica de um conector customizado

Ainda que a especificação completa esteja evoluindo, já é possível entender a estrutura esperada. Abaixo um esqueleto em Python que representa como um conector simples seria organizado:

```python
from databricks.sdk import WorkspaceClient
from databricks.lakeflow.connectors import ConnectorBase, SourceConfig, IncrementalCursor

class MyApiConnector(ConnectorBase):
    """
    Conector de exemplo para uma API REST genérica.
    """

    def __init__(self, config: SourceConfig):
        self.base_url = config.get("base_url")
        self.api_key = config.get("api_key")
        self.cursor = IncrementalCursor(field="updated_at")

    def authenticate(self) -> bool:
        """Valida credenciais antes de iniciar a extração."""
        import requests
        response = requests.get(
            f"{self.base_url}/health",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return response.status_code == 200

    def extract(self, since: str = None):
        """
        Extrai registros incrementais a partir de um cursor de data.
        Retorna um gerador de dicionários.
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
        Retorna o schema esperado para o Unity Catalog.
        O Databricks usa isso para criar ou evoluir a tabela de destino.
        """
        return {
            "id": "string",
            "name": "string",
            "updated_at": "timestamp",
            "payload": "string"
        }
```

E do lado da configuração, via Databricks Workflows, você amarraria isso assim:

```python
# Exemplo de como registrar e acionar o conector via SDK
from databricks.sdk import WorkspaceClient

w = WorkspaceClient()

# Criação de uma pipeline de ingestão usando o conector registrado
pipeline_config = {
    "name": "ingestion_my_api",
    "connector": "community/my_api_connector",
    "destination": {
        "catalog": "main",
        "schema": "raw",
        "table": "my_api_records"
    },
    "schedule": "0 */2 * * *",  # a cada 2 horas
    "config": {
        "base_url": "https://api.myservice.com/v1",
        "api_key": "{{secrets/my_scope/api_key}}"
    }
}

w.lakeflow.pipelines.create(**pipeline_config)
```

O ponto importante aqui é a separação de responsabilidades: o conector sabe como extrair, o Databricks sabe onde guardar e como governar. Você não precisa escrever uma linha de código para lidar com Delta, particionamento ou controle de schema. Isso fica com a plataforma.

## Enfim…

Os Community Connectors representam uma mudança filosófica importante no Databricks. A plataforma está reconhecendo que não consegue, sozinha, cobrir toda a diversidade de fontes de dados que os times precisam, e está abrindo o modelo para que a comunidade resolva isso. É a mesma aposta que funcionou com o Delta Lake, com o MLflow e com o Spark, e há boas razões para acreditar que vai funcionar aqui também.

Para times que já estão all-in no Databricks e sofrem com a dependência de ferramentas externas de ingestão, vale acompanhar de perto a evolução desse ecossistema. Se você tem um SaaS interno ou um sistema legado que ninguém ainda conectou, esse é o momento certo para ser um early contributor e ganhar visibilidade no ecossistema.

O passo imediato é entrar na documentação do Lakeflow Connect, explorar o SDK de conectores e avaliar se alguma fonte que você usa hoje é candidata a um conector comunitário. A contribuição mais simples, um conector funcional bem documentado, pode gerar valor desproporcional para a comunidade inteira.
