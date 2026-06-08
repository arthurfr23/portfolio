---
title: 'Como construir um agente de governança de nomenclatura para o Databricks Unity Catalog'
description: 'Naming conventions são um daqueles temas que todo time de dados concorda em teoria e ignora na prática. A regra existe, o documento está no Confluence…'
date: 2026-04-26
tags: ['Databricks', 'Data Engineering']
canonical: 'https://medium.com/@arthurfr23/como-construir-um-agente-de-governan%C3%A7a-de-nomenclatura-para-o-databricks-unity-catalog-138df3a47239'
---

## Introdução

Naming conventions são um daqueles temas que todo time de dados concorda em teoria e ignora na prática. A regra existe, o documento está no Confluence, e ainda assim, na sexta-feira às 18h, alguém cria uma tabela chamada `df_final_v3_USAR_ESSE` em produção. Você conhece essa história.

O problema não é falta de boa vontade. É que validação manual de nomenclatura não escala. Quando o catálogo tem centenas de schemas e milhares de tabelas, colunas e volumes espalhados por múltiplos workspaces, revisar convenções vira um trabalho de auditoria que ninguém tem tempo de fazer direito. O resultado é entropy acumulada: catálogos inconsistentes que dificultam descoberta de dados, quebram pipelines que dependem de padrões previsíveis, e aumentam o custo cognitivo de qualquer novo engenheiro que entra no time.

A solução proposta por Hubert Dudek é direta: um agente que lê o catálogo inteiro, aplica suas regras de nomenclatura de forma programática, identifica violações e diz exatamente o que precisa ser renomeado. Neste artigo, vou detalhar como você pode construir esse tipo de agente usando Databricks Apps, DABS (Databricks Asset Bundles), Unity Catalog e Workspace Skills, passando pelos componentes técnicos reais e onde está a parte verdadeiramente difícil do projeto.

## Desenvolvimento técnico

## A arquitetura do agente

O sistema tem quatro componentes principais que trabalham juntos:

1. **Unity Catalog como fonte de verdade**: toda a metadata do catálogo, acessível via `information_schema` ou pela API REST do Unity Catalog

2. **Motor de regras**: onde vive a lógica de validação, o coração do sistema

3. **Databricks Apps**: camada de apresentação e interação com o usuário

4. **DABS**: empacotamento e deploy do agente como infraestrutura reproduzível

## Lendo o catálogo com Unity Catalog

O Unity Catalog expõe toda a estrutura do catálogo através do `information_schema`. Para ler objetos de um catálogo específico, você pode usar SQL diretamente:

```sql
-- Lista todos os schemas de um catálogo
SELECT catalog_name, schema_name
FROM system.information_schema.schemata
WHERE catalog_name = 'meu_catalogo';

-- Lista todas as tabelas com seus schemas
SELECT table_catalog, table_schema, table_name, table_type
FROM system.information_schema.tables
WHERE table_catalog = 'meu_catalogo';

-- Lista todas as colunas
SELECT table_catalog, table_schema, table_name, column_name, data_type
FROM system.information_schema.columns
WHERE table_catalog = 'meu_catalogo';
```

Em Python, via Databricks SDK ou `databricks.sdk`:

```python
from databricks.sdk import WorkspaceClient
w = WorkspaceClient()
# Lista todos os catálogos
catalogs = list(w.catalogs.list())
# Lista schemas de um catálogo
schemas = list(w.schemas.list(catalog_name="meu_catalogo"))
# Lista tabelas de um schema
tables = list(w.tables.list(catalog_name="meu_catalogo", schema_name="meu_schema"))
```

Isso te dá acesso programático a toda a hierarquia: catálogos, schemas, tabelas, colunas, volumes e funções.

## O motor de regras: aqui está o trabalho real

Hubert foi direto: “a parte mais difícil foi escrever as regras.” Isso é honesto e merece atenção.

Regras de nomenclatura parecem simples até você tentar formalizá-las. Considere o que parece óbvio, como “tabelas devem usar snake_case”, e você rapidamente percebe que precisa definir o que é violação:

```
- `MinhasVendas` é violação (PascalCase)
- `minhas-vendas` é violação (kebab-case)
- `MINHAS_VENDAS` é violação? Depende do seu padrão
- `minhas_vendas_2024` é válido? E `minhas_vendas_2024_v2`?
```

Um motor de regras robusto precisa de pelo menos três camadas:

**1. Regras estruturais** (formato do nome):

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
    """Valida snake_case: apenas letras minúsculas, números e underscores."""
    return bool(re.match(r'^[a-z][a-z0-9_]*$', name))

def check_no_double_underscores(name: str) -> bool:
    return '__' not in name

def check_max_length(name: str, max_len: int = 64) -> bool:
    return len(name) <= max_len

def check_no_reserved_words(name: str, reserved: set) -> bool:
    return name.lower() not in reserved

RESERVED_WORDS = {'select', 'from', 'table', 'schema', 'drop', 'delete', 'insert'}
```

**2. Regras semânticas** (significado e contexto):

```python
def check_table_prefix(table_name: str, schema_name: str) -> bool:
    """
    Exemplo: tabelas no schema 'raw' devem começar com 'raw_'.
    Adapte conforme sua convenção de camadas (bronze/silver/gold, etc).
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
    Colunas de data devem terminar em _date ou _dt.
    Colunas de timestamp devem terminar em _at ou _timestamp.
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

**3. Regras organizacionais** (consistência entre objetos relacionados):

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
    """Converte PascalCase ou camelCase para snake_case."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
```

## Integrando com Workspace Skills (LLM no loop)

O diferencial de usar Workspace Skills é que você pode invocar um modelo de linguagem para sugerir correções mais inteligentes, especialmente para casos ambíguos. Em vez de uma regex que sugere `minha_tabela_v2` de volta, o LLM consegue inferir o contexto e propor `mrt_vendas_mensal` com base no schema e no conteúdo.

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
Você é um especialista em governança de dados. 
Analise o objeto abaixo e sugira um nome corrigido seguindo as convenções.

Objeto: {object_type} '{object_name}'
Schema: {context.get('schema', 'desconhecido')}
Violações identificadas: {', '.join(violations)}
Convenções do time:
- snake_case obrigatório
- Prefixos por camada: brz_ (bronze), slv_ (silver), gld_ (gold), mrt_ (mart)
- Colunas de data terminam em _date
- Sem abreviações ambíguas

Responda apenas com o nome sugerido, sem explicações.
"""

    response = w.serving_endpoints.query(
        name="databricks-meta-llama-3-1-70b-instruct",
        messages=[ChatMessage(role=ChatMessageRole.USER, content=prompt)]
    )

    return response.choices[0].message.content.strip()
```

## Deploy com DABS

O Databricks Asset Bundle empacota tudo como infraestrutura versionada. A estrutura básica do bundle:

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

O Databricks Apps serve como interface web onde engenheiros podem ver o relatório de violações, filtrar por catálogo ou schema, e copiar os comandos de rename gerados automaticamente.

## Exemplo prático: rodando o audit completo

```python
from databricks.sdk import WorkspaceClient
from typing import Generator

def audit_catalog(catalog_name: str) -> Generator[NamingViolation, None, None]:
    w = WorkspaceClient()

    # Itera por schemas
    for schema in w.schemas.list(catalog_name=catalog_name):
        schema_name = schema.name

        if not check_snake_case(schema_name):
            yield NamingViolation(
                object_type="schema",
                full_name=f"{catalog_name}.{schema_name}",
                rule_violated="snake_case_required",
                suggestion=to_snake_case(schema_name)
            )

        # Itera por tabelas dentro do schema
        for table in w.tables.list(catalog_name=catalog_name, schema_name=schema_name):
            table_name = table.name

            violations = validate_table(table_name, schema_name, catalog_name)
            yield from violations

            # Itera por colunas
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

# Executando e gerando relatório
violations = list(audit_catalog("producao"))
print(f"Total de violações encontradas: {len(violations)}")

# Gerando comandos de rename
for v in violations:
    if v.object_type == "table" and v.suggestion:
        parts = v.full_name.split(".")
        print(f"ALTER TABLE {v.full_name} RENAME TO {parts[0]}.{parts[1]}.{v.suggestion};")
```

O output é uma lista de comandos SQL prontos para execução, com o rename exato que precisa acontecer. O engenheiro revisa, aprova, e roda. Sem julgamento subjetivo, sem discussão em pull request sobre se `ClienteVIP` deveria ser `cliente_vip` ou `clientes_vip`.

## Conclusão

O projeto do Hubert resolve um problema real com uma abordagem pragmática: não tente convencer as pessoas a seguirem convenções manualmente, automatize a detecção e gere as correções. A stack escolhida (Unity Catalog, Databricks Apps, DABS e LLM via Workspace Skills) faz sentido porque mantém tudo dentro do ecossistema Databricks, reduz fricção de adoção e permite deploy reproduzível.

O aprendizado mais honesto aqui é que a tecnologia é a parte fácil. O motor de regras, que parece simples, é onde você vai gastar a maior parte do tempo, porque formalizar o que parece óbvio revela ambiguidades que seu time nunca discutiu explicitamente. Antes de escrever uma linha de código, sente com o time e documente as regras com casos de borda reais.

As limitações também existem: renomear tabelas em produção tem implicações em downstream jobs, dashboards e APIs que consomem esses objetos. O agente detecta e sugere, mas a execução precisa de uma estratégia de migração cuidadosa, especialmente em ambientes onde não há controle total sobre todos os consumidores. Para catálogos grandes com histórico longo, convém priorizar as violações por impacto e atacar incrementalmente.

O próximo passo natural é integrar esse audit no CI/CD via DABS, bloqueando a criação de novos objetos que violem convenções antes mesmo de chegarem ao catálogo de produção. Governança reativa é melhor que nenhuma, mas governança preventiva é onde o custo de correção cai de verdade.

Artigo original do Dudek:

[Implementing Enterprise Naming Convention, Agentic Way](https://databrickster.medium.com/implementing-enterprise-naming-convention-agentic-way-3d1df7f5aef6)
