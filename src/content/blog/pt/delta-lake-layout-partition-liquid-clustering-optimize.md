---
title: 'Escolhendo o layout de uma tabela Delta Lake: quando particionar, usar Liquid Clustering e rodar OPTIMIZE'
description: 'Uma tabela de pedidos é particionada por data. Parece razoável — até que uma query importante busca um cliente em todo o histórico de pedidos…'
date: 2026-10-01
tags: ['Data Engineering', 'Databricks', 'Delta Lake']
canonical: 'https://medium.com/@arthurfr23/choosing-a-delta-lake-layout-when-to-partition-use-liquid-clustering-and-run-optimize-c046650cb41b'
---

_Casos de uso, limites, experimentos em SQL e um processo prático de decisão para engenheiros Databricks._

Uma tabela de pedidos é particionada por data. Parece razoável — até que uma query importante busca um cliente em todo o histórico de pedidos.

As partições de data não conseguem eliminar datas quando a query não tem predicado de data. As estatísticas dos arquivos ainda podem ajudar, mas a decisão original de layout não atende diretamente esse padrão de acesso.

A tentação é responder adicionando mais comandos de manutenção. Antes disso, separe duas decisões:

  - Como a tabela deve organizar os dados?
  - Qual operação deve manter essa organização?

Este guia conecta PARTITIONED BY, CLUSTER BY, OPTIMIZE e ZORDER BY por meio de três configurações práticas. Os exemplos são para tabelas Delta no Databricks com Unity Catalog.

## 1. Separe o layout da tabela da manutenção

**PARTITIONED BY** — Define os limites das partições da tabela. A manutenção opera dentro desses limites

**CLUSTER BY no DDL da tabela** — Configura as chaves do Liquid Clustering. O OPTIMIZE usa essas chaves

**OPTIMIZE** — Reescreve arquivos para melhorar o layout. O comportamento depende da configuração da tabela

**ZORDER BY dentro do OPTIMIZE** — Agrupa valores próximos para apoiar o file skipping. Disponível para tabelas sem Liquid Clustering

A sintaxe de DDL da tabela é PARTITIONED BY. A expressão PARTITION BY usada em window functions do SQL tem outro propósito.

Para tabelas novas, o Databricks recomenda Liquid Clustering. Tabelas particionadas existentes ainda precisam de uma estratégia de manutenção bem informada, principalmente enquanto uma migração está sendo avaliada. Veja as [orientações sobre particionamento](https://docs.databricks.com/aws/en/tables/partitions).

## 2. Comece pelas queries que você realmente precisa atender

Para uma carga de pedidos, selecione vários formatos de query antes de mudar o layout:

**Histórico do cliente** — customer_id = 842. Se os valores de cliente conseguem eliminar arquivos

**Vendas por país** — country_code = 'BR'. Se o partition pruning por país ajuda

**Vendas recentes** — Um intervalo limitado de order_date. Se o filtro de data continua eficiente

**Cliente dentro de um período** — Predicados de cliente e de data. Se o layout atende a combinação dos dois

**Agregação ampla** — Sem filtro seletivo. Se o scan continua sendo o custo dominante

Use clientes frequentes e intervalos de data reais da sua carga. Inclua valores comuns e raros, principalmente se a distribuição for assimétrica.

Um layout que vence para um cliente raro pode decepcionar quando um cliente grande responde por uma fração considerável da tabela.

## Escolha uma candidata a partir do caso de uso

Os casos abaixo são experimentos propostos, não resultados medidos em clientes.

**Caso A: uma tabela de vendas existente particionada por país.** A empresa opera em poucos países, cada um com volume considerável de dados, e as queries importantes filtram consistentemente por country_code. Um predicado como WHERE country_code = 'BR' consegue podar as partições dos outros países. Mantenha o layout atual como baseline somente quando o benefício dele for medido. Baixa cardinalidade sozinha não basta: um país dominante ainda pode exigir um scan grande, enquanto mercados pequenos podem gerar partições subdimensionadas. Compare os custos de leitura e de manutenção com uma candidata clusterizada.

**Caso B: pedidos buscados por cliente ao longo de muitas datas.** Uma query de histórico do cliente não consegue podar partições de data usando apenas um predicado de cliente. Avalie Liquid Clustering em customer_id; adicione order_date como segunda chave candidata quando a carga também depender de intervalos de data seletivos. Meça as duas configurações em vez de assumir que duas chaves superam uma.

**Caso C: uma tabela em crescimento com distribuição desigual de tenants.** Particionar por um identificador de tenant de alta cardinalidade pode deixar muitas partições minúsculas ao lado de poucas partições grandes. Avalie clustering no identificador do tenant e em qualquer coluna de filtro útil por si só. Inclua um tenant grande no teste: o clustering não consegue pular linhas de que a query realmente precisa. O layout dos arquivos também não corrige automaticamente skew de join ou um plano de execução ruim.

**Caso D: uma tabela de referência pequena ou agregações quase sempre sobre a tabela inteira.** Mantenha um baseline simples, sem particionamento. Se todos os arquivos são baratos de ler, a manutenção extra de layout pode não se pagar. Para tabelas gerenciadas elegíveis, avalie o clustering automático separadamente; não assuma que ele sempre vai selecionar chaves.

## Baixa cardinalidade é só uma das condições

País é o exemplo de particionamento aqui porque o conjunto limitado de valores deixa o trade-off claro. Verifique os bytes armazenados por país, a assimetria da distribuição e os predicados de país realmente usados. Uma tabela com cinco países não tem automaticamente cinco partições úteis. Se um país concentra quase todos os dados, as queries dele ainda leem a maior parte da tabela.

Particionamento diário por DATE pode ser válido em algumas cargas; é diferente de particionar por um TIMESTAMP de evento bruto. Usamos país para manter este passo a passo focado, não porque todo particionamento por data esteja errado. Para uma tabela nova no Databricks, avalie primeiro o Liquid Clustering.

## Orientações de tamanho e limites das funcionalidades

O Databricks desaconselha particionar tabelas abaixo de 1 TB e recomenda pelo menos 1 GB por partição. São recomendações de planejamento, não limites impostos pelo engine. Ultrapassar qualquer um desses limites não prova que particionar é a melhor escolha. Veja as [recomendações atuais de particionamento](https://docs.databricks.com/aws/en/tables/partitions#minimum-size-recommendations).

O Liquid Clustering suporta até quatro chaves, e essas colunas precisam ter estatísticas de arquivo. Mais chaves podem diluir o benefício para queries que filtram por uma única coluna. Ele não pode coexistir com particionamento ou Z-order na mesma tabela Delta. Confira os [requisitos de clustering](https://docs.databricks.com/aws/en/tables/clustering#choose-clustering-keys) e a compatibilidade de todos os leitores e escritores antes de migrar.

## Inspecione o layout atual primeiro

```sql
DESCRIBE DETAIL main.slv_sales.slv_orders;
DESCRIBE HISTORY main.slv_sales.slv_orders;
```

Registre partitionColumns, clusteringColumns, numFiles e sizeInBytes da saída do detail, quando disponíveis, e as operações recentes de escrita e otimização do history. Dividir os bytes da tabela pelo número de arquivos dá um tamanho médio aproximado de arquivo, não a distribuição do tamanho das partições.

Para uma origem particionada, esta query revela o desequilíbrio de linhas por país:

```sql
SELECT
  country_code,
  COUNT(*) AS row_count
FROM main.slv_sales.slv_orders
GROUP BY country_code
ORDER BY row_count DESC;
```

Rode quando o scan de diagnóstico se justificar. Contagem de linhas não prova que uma partição tem 1 GB: compressão e largura das linhas variam. Meça o armazenamento das partições separadamente quando esse critério conduzir a decisão.

## 3. Crie três configurações em um laboratório isolado

Use um catálogo existente do Unity Catalog onde você possa criar tabelas gerenciadas. Os exemplos usam main; substitua pelo seu catálogo.

Para um passo a passo consistente, use Databricks Runtime 16.4 LTS ou mais recente. O exemplo opcional de conversão de partições, mais adiante, exige 18.1 ou mais recente. Estes exemplos são templates de configuração, não resultados de um benchmark de produção.

Crie um schema dedicado:

```sql
CREATE SCHEMA IF NOT EXISTS main.gld_layout_lab;
```

**Configuração A: sem partições e sem Liquid Clustering**

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

**Configuração B: particionada por país**

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

**Configuração C: Liquid Clustering**

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

A tabela clusterizada não tem cláusula PARTITIONED BY. São três configurações separadas, não três etapas aplicadas a uma mesma tabela. A [referência de CLUSTER BY](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-syntax-ddl-cluster-by) documenta a sintaxe do DDL.

## Carregue o mesmo snapshot

Considere que a origem é uma tabela Delta chamada main.slv_sales.slv_orders, com as cinco colunas mostradas acima e um order_id único e não nulo.

Use DESCRIBE HISTORY para escolher uma versão retida da origem:

```sql
DESCRIBE HISTORY main.slv_sales.slv_orders;
```

No template a seguir, substitua 123 por essa versão. Rode-o para cada tabela de destino, mudando apenas o nome do destino. Mantenha a versão de origem fixa durante toda a comparação.

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

Essa carga somente de inserção é repetível contra o mesmo snapshot quando a chave de origem é única. É um padrão de carga para laboratório, não uma implementação de SCD.

Crie tabelas de destino novas para um novo snapshot de origem. Reaproveitar essa carga somente de inserção com outro snapshot deixaria valores antigos nos destinos.

Antes do benchmark, verifique se as três cópias têm as mesmas linhas. Contagem de linhas e total de receita são boas primeiras verificações; use um EXCEPT ALL nos dois sentidos sobre as cinco colunas quando precisar de igualdade exata de multiconjunto.

Para um experimento manual controlado, impeça que manutenções agendadas alterem as tabelas do laboratório entre as execuções. Se o predictive optimization estiver herdado, o dono da tabela pode desabilitá-lo apenas nessas três tabelas de laboratório:

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

Registre a configuração de manutenção original. Esse isolamento serve ao experimento; não é uma recomendação para desabilitar a manutenção automática em produção.

## 4. Aplique a manutenção adequada a cada layout

Para a tabela simples:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_plain;
```

Sem Liquid Clustering nem cláusula ZORDER BY, isso faz uma compactação por bin-packing. Não introduz clustering por cliente.

Para a tabela particionada, teste primeiro a compactação comum:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_partitioned;
```

Registre as medições das queries. Depois teste o tratamento opcional com Z-order:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_partitioned
ZORDER BY (customer_id);
```

Isso agrupa valores próximos dentro de cada partição de país. O Z-order também pode ser usado em tabelas não particionadas; ele não é exclusivo de tabelas particionadas.

Para a tabela com Liquid Clustering:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_liquid;
```

Aqui a operação usa as chaves de clustering configuradas. Não acrescente ZORDER BY a esse comando.

Essas são operações de reescrita de arquivos. A [referência do OPTIMIZE](https://docs.databricks.com/aws/en/sql/language-manual/delta-optimize) descreve a diferença entre compactação e Z-order; o [guia de manutenção de layout](https://docs.databricks.com/aws/en/tables/operations/optimize) explica o comportamento para tabelas clusterizadas e particionadas.

## 5. Inspecione o file skipping, não só o cronômetro

Rode uma query representativa contra cada destino:

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

Mude apenas o nome da tabela ao comparar as configurações. Repita os outros formatos de query da matriz de carga.

No Databricks SQL, desabilite o reaproveitamento de resultados na sessão de medição:

```sql
SET use_cached_result = false;
```

Isso controla o [cache de resultados do SQL](https://docs.databricks.com/aws/en/sql/language-manual/parameters/use_cached_result). Não limpa o cache de disco nem outros caches, então registre as condições de cache em vez de assumir que toda execução é a frio.

Abra **Query History → detalhes da query → See query profile**. Inspecione o scan e os operadores mais caros. O [query profile](https://docs.databricks.com/aws/en/sql/user/queries/query-profile) expõe detalhes de execução e I/O que ajudam a distinguir menos leitura de acesso mais rápido por cache.

Guarde as seguintes medições:

**Arquivos e bytes lidos** — Mostra se o scan fez menos trabalho

**Latência de execução** — Captura o benefício percebido pelo usuário

**Tempo de fila e de inicialização** — Separa disponibilidade de compute da execução da query

**Arquivos adicionados e removidos pela manutenção** — Mostra quanto trabalho de layout foi feito

**Duração e custo de compute da manutenção** — Ajuda a avaliar se o ganho de leitura paga a reescrita

**Latência de escrita ou de MERGE** — Detecta regressões na ingestão e nas atualizações

Use a mesma configuração de compute e alterne a ordem de execução. Reporte mediana e amplitude de várias execuções, em vez de escolher o resultado mais rápido.

## Confira as estatísticas por trás do skipping

O file skipping depende de estatísticas como valores mínimos e máximos. O clustering pode tornar esses intervalos mais úteis, mas o skipping também está disponível em tabelas Delta particionadas e não clusterizadas.

Para gerenciar as estatísticas manualmente, você pode escolher explicitamente as colunas relevantes:

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

Aplique uma política de estatísticas consistente a todas as tabelas da comparação antes de medir. Alterar apenas a propriedade não recalcula as estatísticas dos dados existentes. Veja a [documentação de data skipping](https://docs.databricks.com/aws/en/tables/data-skipping).

## 6. Separe a troca de chave do reclustering histórico

Suponha que o experimento mostre que o acesso apenas por cliente predomina e você queira avaliar uma única chave:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
CLUSTER BY (customer_id);
```

Isso muda a configuração. Não reorganiza imediatamente todos os dados que já estavam clusterizados.

Para forçar o reclustering dos dados históricos sob a configuração atual:

```sql
OPTIMIZE main.gld_layout_lab.gld_orders_liquid FULL;
```

Trate isso como um evento de manutenção explícito e meça o custo. A manutenção incremental posterior e uma mudança de layout histórica são experimentos diferentes.

O [guia de clustering do Delta Lake](https://docs.delta.io/delta-clustering/) explica a diferença entre trocar as chaves, clustering incremental e reclustering forçado. O suporte de runtime varia entre o Delta Lake open source e o Databricks; este passo a passo é voltado ao Databricks.

## 7. Saiba o que o clustering automático automatiza

Para tabelas gerenciadas elegíveis do Unity Catalog:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
ENABLE PREDICTIVE OPTIMIZATION;
```

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_liquid
CLUSTER BY AUTO;
```

O Liquid Clustering automático seleciona chaves usando informações da carga de trabalho. O predictive optimization executa a manutenção de forma assíncrona. São capacidades relacionadas, com responsabilidades diferentes.

Use isso como uma fase separada, depois da comparação manual. Caso contrário, uma configuração que muda sozinha torna o experimento mais difícil de interpretar.

O predictive optimization também roda ANALYZE e VACUUM; não é simplesmente um agendamento automático de OPTIMIZE. Revise a política de retenção existente e considere o custo da manutenção serverless. Evite jobs manuais sobrepostos com a mesma responsabilidade. Veja [predictive optimization](https://docs.databricks.com/aws/en/optimizations/predictive-optimization) e [Liquid Clustering automático](https://docs.databricks.com/aws/en/tables/clustering#automatic-liquid-clustering).

## Uma observação sobre tabelas particionadas existentes

O Databricks Runtime 18.1 e mais recentes oferecem um comando dedicado de conversão:

```sql
ALTER TABLE main.gld_layout_lab.gld_orders_partitioned
REPLACE PARTITIONED BY WITH CLUSTER BY (
  order_date,
  customer_id
);
```

Este é um experimento de migração opcional, depois da comparação, e não mais uma otimização a empilhar sobre o baseline particionado. Planeje o OPTIMIZE seguinte e inspecione as dependências antes de aplicar em produção. Consulte os [requisitos de conversão](https://docs.databricks.com/aws/en/tables/clustering#convert-a-partitioned-table-to-liquid-clustering), principalmente para consumidores de streaming e compartilhamentos filtrados por partição.

## 8. Diagnostique o resultado antes de adotar o layout

**Menos arquivos, bytes lidos parecidos** — A compactação reduziu o overhead de arquivos; verifique se os predicados conseguem pular mais dados

**Menos bytes lidos, latência parecida** — Inspecione joins, shuffles, tempo de fila e outros operadores dominantes

**Queries por cliente melhoram, queries por data pioram** — Revise a escolha de chaves e pondere os resultados pela frequência real das queries

**Queries melhoram, mas a manutenção fica cara** — Reavalie a cadência de manutenção e o custo total da carga

**Nenhuma mudança mensurável** — Verifique estatísticas, seletividade, condições de cache e se a tabela já estava bem organizada

Use uma planilha de resultados com uma linha por formato de query e configuração. Registre a mediana do tempo de execução, bytes lidos, arquivos lidos, igualdade dos resultados e o custo de cada tratamento de manutenção. Deixe métricas ausentes em branco em vez de estimá-las a partir de um print ou de uma execução sem relação.

Defina critérios de aceite antes do experimento: latência exigida das queries, regressão máxima tolerada para as outras queries, SLA de ingestão e orçamento de manutenção. Os limites devem vir da sua aplicação, não de um percentual universal.

## 9. Tome a decisão olhando a carga inteira

Para uma tabela nova no Databricks, comece avaliando o caminho recomendado de Liquid Clustering. Para uma tabela existente, estabeleça um baseline antes de mudar qualquer coisa.

Fique com a configuração que atende às metas de latência com um custo combinado aceitável de leitura, escrita e manutenção. Um bom registro de decisão contém o snapshot de origem, as configurações das tabelas, os predicados representativos, as configurações de compute, as condições de cache e os resultados medidos.

Se uma mudança melhora a query de um cliente mas piora a carga frequente por intervalo de datas, esse trade-off faz parte da decisão. Se a tabela é pequena e os scans já eram baratos, um layout mais elaborado pode trazer pouco benefício prático.

Na próxima vez que um job de OPTIMIZE terminar com sucesso, confira também as medições da carga. Uma manutenção bem-sucedida prova que a operação rodou; o valor dela vem do que mudou para as queries e pipelines que usam a tabela.
