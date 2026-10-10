---
title: 'Databricks Genie: um guia prático das tabelas às respostas testadas'
description: 'Uma query pode executar com sucesso e ainda assim responder à pergunta errada. Um guia prático para montar um Genie Agent focado, com regras de negócio, SQL de referência e benchmarks…'
date: 2026-09-25
tags: ['Databricks', 'Genie', 'AI']
canonical: 'https://medium.com/@arthurfr23/databricks-genie-a-practical-guide-from-tables-to-tested-answers-aa91dff98587'
---

_Monte um assistente de analytics de vendas focado, com regras de negócio explícitas, SQL de referência e benchmarks._

Uma query pode executar com sucesso e ainda assim responder à pergunta errada.

Pergunte "Qual foi a nossa receita no mês passado?" e várias interpretações se tornam possíveis. Receita bruta ou líquida? Incluindo pedidos cancelados? Pela data da compra ou pela data do pagamento?

Uma interface conversacional facilita fazer a pergunta. O trabalho de engenharia é tornar o significado explícito e conferir a resposta.

Este tutorial percorre um pequeno exemplo de analytics de vendas: preparar um dataset, configurar o contexto dele no Genie, adicionar queries de referência e avaliar os resultados.

Os dados são sintéticos. Os resultados esperados são derivados das linhas de exemplo, não de uma implantação real do Genie com métricas medidas.

## O que vamos configurar

A documentação atual do Databricks chama esses recursos de **Genie Agents**, antes conhecidos como **Genie Spaces**. Eles permitem que usuários façam perguntas sobre dados configurados usando linguagem natural. Este tutorial foca nessa experiência analítica, e não no assistente para desenvolvedores Genie Code. [Conceitos no Databricks](https://docs.databricks.com/aws/en/genie-agents/concepts)

O escopo inicial é propositalmente estreito:

  - Receita líquida mensal.
  - Receita por segmento de cliente.
  - Contagem de pedidos concluídos e cancelados.

Churn, previsões e rentabilidade por produto ficam fora do escopo.

Esse limite nos dá algo que conseguimos avaliar antes de adicionar mais tabelas e perguntas.

## 1. Crie um dataset com respostas conhecidas

Você precisa de um workspace com Unity Catalog habilitado, um catálogo existente onde seja possível criar um schema e uma tabela de demonstração, e um SQL warehouse elegível. Quem cria o Genie precisa dos privilégios de dados relevantes e de acesso ao warehouse selecionado. Confira o seu workspace contra os [requisitos de configuração atuais](https://docs.databricks.com/aws/en/genie-agents/set-up).

Execute o código abaixo em um editor SQL, substituindo your_catalog por um catálogo de desenvolvimento existente. Use um schema de demonstração novo para que os resultados esperados continuem reproduzíveis.

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

Estamos declarando o schema explicitamente. Valores monetários usam tipo decimal, e a tabela tem uma linha por pedido.

Insira cinco registros:

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

O MERGE permite reexecutar a carga sem duplicar esses pedidos. Ele não remove linhas não relacionadas, e é por isso que uma tabela de demonstração dedicada importa.

Para este exercício, a definição de negócio é:

> _Receita é a soma de net_revenue dos pedidos concluídos, agrupada pela data da compra. Todos os valores estão em BRL._

Com essa definição:

  - Agosto de 2026: **BRL 400,00**.
  - Setembro de 2026: **BRL 600,00**.

O pedido cancelado de agosto mantém o valor registrado. É o filtro de status que determina se esse valor entra na métrica.

## 2. Documente o significado, não só o nome das colunas

Uma descrição como "Coluna de receita líquida" não acrescenta quase nada.

Metadados úteis explicam o valor, a unidade, a granularidade e as exceções.

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

Confira a granularidade antes de seguir:

```sql
SELECT
    COUNT(*) AS row_count,
    COUNT(DISTINCT order_id) AS distinct_order_count
FROM gld_genie_demo.gld_orders;
```

Para este conjunto de teste, os dois valores devem ser 5.

Em um dataset de produção, uma divergência exigiria investigação. Um comentário descritivo não torna única uma chave duplicada.

## 3. Crie um Genie Agent focado

Na interface atual:

  1. Abra **Genie Agents** e selecione **New**.
  2. Adicione a tabela de demonstração como fonte.
  3. Crie o agente.
  4. Revise o SQL warehouse selecionado em **Configure → Settings**.
  5. Revise as sugestões de configuração geradas antes de aceitá-las.

O fluxo de configuração atual pode usar o Genie Code para sugerir contexto. Trate essas sugestões como rascunhos a inspecionar, principalmente definições de negócio e queries de exemplo. [Fluxo de criação](https://docs.databricks.com/aws/en/genie-agents/set-up)

Use um título claro, como **Sales Analytics Demo**, e uma descrição que deixe o escopo explícito:

> _Responde perguntas sobre receita de pedidos concluídos e contagem de pedidos no dataset sintético de vendas. Valores em BRL. Churn e previsões não estão definidos._

Evite adicionar todas as tabelas disponíveis nesta etapa. Comece pelas fontes necessárias para responder às perguntas iniciais.

## 4. Adicione instruções de negócio precisas

Os metadados descrevem os dados. As instruções explicam como interpretar perguntas neste domínio.

Uma configuração inicial para a demonstração:

```
Escopo:
- Responder perguntas sobre receita e contagem de pedidos.
- A moeda é BRL. Conversão de moeda não está disponível.
```

```
Receita:
- Usar net_revenue.
- Incluir apenas pedidos com order_status = 'COMPLETED'.
- Agregar por order_date, que representa a data da compra.
```

```
Contagem de pedidos:
- Para o total de pedidos, incluir todos os status.
- Para pedidos concluídos, filtrar COMPLETED.
- Para pedidos cancelados, filtrar CANCELLED.
```

```
Tempo:
- Usar meses e trimestres do calendário.
- Pedir esclarecimento quando o período solicitado for ambíguo.
```

```
Métricas não definidas:
- Churn e lucro não estão definidos neste dataset.
- Explicar a definição ausente em vez de inventar uma fórmula.
```

Repare na separação entre receita e contagem de pedidos.

Uma instrução genérica para "sempre excluir pedidos cancelados" entraria em conflito com uma pergunta legítima como "Quantos pedidos foram cancelados?"

As instruções devem resolver ambiguidades sem bloquear análises válidas.

O Genie também pode usar um knowledge store no nível do agente para descrições, relacionamentos e outros contextos semânticos. Essas configurações têm escopo no agente e não alteram os metadados do Unity Catalog. [Conceitos de configuração de contexto](https://docs.databricks.com/aws/en/genie-agents/concepts)

## 5. Adicione um exemplo de SQL revisado

Escolha uma pergunta recorrente:

> _Qual é a nossa receita líquida de pedidos concluídos por mês?_

Use uma referência totalmente qualificada da tabela, substituindo your_catalog:

```sql
SELECT
    CAST(date_trunc('month', order_date) AS DATE) AS revenue_month,
    SUM(net_revenue) AS net_revenue_brl
FROM your_catalog.gld_genie_demo.gld_orders
WHERE order_status = 'COMPLETED'
GROUP BY 1
ORDER BY 1;
```

A saída esperada é:

```
revenue_month | net_revenue_brl
2026-08-01    | 400.00
2026-09-01    | 600.00
```

Adicione a pergunta e a query revisadas aos SQL examples do agente.

Mantenha três conceitos separados:

  - **Example SQL** fornece lógica de referência para gerar respostas.
  - **Trusted assets** envolvem lógica verificada em queries de exemplo parametrizadas ou funções SQL.
  - **Benchmarks** avaliam respostas; eles não fornecem contexto para respondê-las.

Uma query de exemplo comum não deve ser automaticamente tratada como trusted asset. [Definições oficiais](https://docs.databricks.com/aws/en/genie-agents/concepts)

## 6. Teste as respostas com benchmarks

Uma conversa bem-sucedida é uma verificação pontual útil. Ela não basta para garantir um comportamento consistente.

Monte um pequeno conjunto de testes com resultados esperados explícitos:

  - **Qual foi a receita líquida em agosto de 2026?** BRL 400,00.
  - **Qual foi a receita líquida em setembro de 2026?** BRL 600,00.
  - **Quantos pedidos foram feitos em agosto de 2026?** 3.
  - **Quantos pedidos de agosto foram cancelados?** 1.
  - **Qual foi a receita enterprise em agosto de 2026?** BRL 300,00.
  - **Qual foi o churn em agosto de 2026?** Explicar que churn não está definido.

Para a pergunta da receita de agosto, o SQL de referência é:

```sql
SELECT
    SUM(net_revenue) AS net_revenue_brl
FROM your_catalog.gld_genie_demo.gld_orders
WHERE order_status = 'COMPLETED'
  AND order_date >= DATE '2026-08-01'
  AND order_date < DATE '2026-09-01';
```

Em **Benchmarks**, adicione a pergunta e a respectiva **SQL Answer** e rode a avaliação em **Chat mode**. Inspecione a query gerada e o resultado da comparação.

A avaliação em Chat mode consegue comparar os resultados com o SQL de referência. Perguntas sem SQL answer exigem revisão manual. A avaliação em Agent mode usa outra abordagem de correção, então mantenha o mesmo modo ao comparar execuções. [Documentação de benchmarks](https://docs.databricks.com/aws/en/genie-agents/monitor)

Adicione formulações alternativas, como:

  - "Quanto de receita líquida geramos em agosto de 2026?"
  - "Mostre a receita de agosto de 2026 dos pedidos concluídos."

Inclua também perguntas que não sejam cópias dos seus SQL examples. Caso contrário, o conjunto de testes pode ficar estreito demais para revelar lacunas.

Para cada falha, identifique a categoria antes de mudar qualquer coisa:

  - **Inclui pedidos cancelados:** investigue a regra de status ou um filtro ausente.
  - **Usa o mês errado:** investigue o campo de data ou a interpretação dos limites do período.
  - **Retorna o segmento errado:** investigue os valores da categoria ou a definição de segmento.
  - **Inventa churn:** investigue as instruções de escopo e o comportamento de pedir esclarecimento.
  - **Produz totais inesperados:** investigue granularidade, joins, duplicidades ou a definição da métrica.

Ajuste o contexto relevante, rode a suíte de novo e confira se os casos que estavam corretos continuam passando.

## 7. Fique atento ao fanout de joins conforme o modelo cresce

Suponha que, mais tarde, você adicione uma tabela de itens do pedido.

O relacionamento passa a ser:

```
gld_orders: uma linha por pedido
             1 → N
gld_order_items: uma linha por item do pedido
```

Se um pedido de BRL 300 tem três itens, o join entre as tabelas produz três linhas contendo esse valor no nível do pedido. Somar depois do join pode resultar em BRL 900.

SUM(DISTINCT net_revenue) não é uma solução geral: pedidos diferentes podem legitimamente ter o mesmo valor.

A abordagem correta depende da pergunta. Você pode agregar os itens antes do join, consultar na granularidade do pedido ou definir uma regra de rateio para a receita por produto.

Ao adicionar uma tabela nova, adicione testes que exercitem os relacionamentos dela. Não assuma que a suíte de benchmarks antiga cobre o modelo expandido.

## 8. Valide o acesso e o comportamento operacional

Resultados corretos são só uma parte da prontidão.

O Genie diferencia acesso ao warehouse de acesso aos dados. As credenciais de compute configuradas dão acesso ao warehouse, enquanto o Unity Catalog avalia o acesso aos dados usando a identidade do usuário final. [Modelo de acesso](https://docs.databricks.com/aws/en/genie-agents/set-up)

Teste com uma conta representativa de consumidor, não só com a conta de quem criou o agente.

O meu checklist de liberação incluiria:

  - As perguntas de negócio suportadas têm respostas esperadas revisadas.
  - Métricas não definidas geram um pedido de esclarecimento adequado.
  - Perguntas sensíveis a joins preservam a granularidade pretendida.
  - Usuários representativos veem apenas dados autorizados.
  - Latência e custo das queries são aceitáveis para a carga esperada.
  - Instruções e queries de referência têm um responsável.
  - Mudanças de configuração disparam uma nova rodada de avaliação.

Para datasets que mudam, compare os resultados do Genie e de referência sobre dados consistentes. Caso contrário, uma atualização entre as execuções pode parecer uma falha de raciocínio.

O SQL deste artigo é um passo a passo para rodar no seu workspace de desenvolvimento. Ele não representa uma implantação de produção testada nem uma garantia de precisão do Genie.

## Comece por um domínio que você consegue verificar

Uma primeira implantação útil não precisa responder a todas as perguntas sobre a empresa.

Ela precisa de um escopo definido, significados explícitos para as métricas, dados adequados e um conjunto de testes que pegue erros relevantes.

Expanda quando você conseguir explicar tanto por que uma resposta está correta quanto como detectaria o momento em que ela deixa de estar.
