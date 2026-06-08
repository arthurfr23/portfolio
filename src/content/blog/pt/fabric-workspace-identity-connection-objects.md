---
title: 'Autenticação segura em notebooks do Microsoft Fabric com Workspace Identity e Connection Objects'
description: 'Se você trabalha com notebooks no Microsoft Fabric, provavelmente já passou pela situação clássica: durante o desenvolvimento, tudo funciona…'
date: 2026-06-01
tags: ['Databricks', 'Data Engineering']
canonical: 'https://medium.com/@arthurfr23/autentica%C3%A7%C3%A3o-segura-em-notebooks-do-microsoft-fabric-com-workspace-identity-e-connection-objects-94b5315b6909'
---

Se você trabalha com notebooks no Microsoft Fabric, provavelmente já passou pela situação clássica: durante o desenvolvimento, tudo funciona perfeitamente porque o notebook roda com sua própria identidade. Você acessa o Azure Data Lake, o Key Vault, a API externa, e segue em frente. Aí chega o momento de promover para produção, e começa o problema. Sua identidade pessoal não deveria ter acesso a recursos produtivos. Pior ainda, se alguém hardcodar credenciais diretamente no notebook, você tem um risco de segurança sério esperando para explodir.

O problema não é novo no mundo de dados. Qualquer engenheiro que já trabalhou com pipelines de dados em produção sabe que gerenciar autenticação de forma segura é uma das partes mais chatas, porém mais críticas, do trabalho. No Fabric, a resposta para isso passa por dois conceitos que, juntos, resolvem esse problema de forma elegante: o **Workspace Identity** e os **Connection Objects**.

A questão é que a documentação oficial cobre cada um desses componentes de forma isolada. Na prática, o que você precisa é entender como eles se encaixam, em qual ordem as coisas precisam acontecer, e onde estão as armadilhas que vão te fazer perder horas de depuração. É exatamente isso que esse artigo cobre.

## O que é o Workspace Identity

O Workspace Identity é, essencialmente, uma identidade gerenciada associada ao seu workspace do Fabric. Em vez de autenticar com suas credenciais de usuário (o que cria um acoplamento perigoso entre você e os recursos de produção), o workspace em si tem uma identidade própria, que pode receber permissões nos recursos do Azure.

Isso é análogo às Managed Identities no Azure, e de fato por baixo dos panos é exatamente isso que acontece. A diferença é que agora você pode usar essa identidade dentro do contexto de execução dos notebooks, spark jobs e outros artefatos do Fabric.

O benefício prático é direto: você remove credenciais do código, reduz a superfície de ataque, e facilita a rotação de permissões sem precisar alterar notebooks. Se um recurso precisa ser acessado por produção, você dá permissão ao workspace, não ao seu usuário pessoal.

## Connection Objects

O Workspace Identity resolve metade do problema. A outra metade é como você referencia essa identidade dentro dos seus notebooks de forma reutilizável e desacoplada do código. É aqui que entram os **Connection Objects**.

Um Connection Object no Fabric é um artefato que encapsula as informações de conexão a um recurso externo, incluindo qual método de autenticação usar. Quando você cria um Connection Object configurado para usar o Workspace Identity, ele age como uma ponte: o notebook solicita a conexão pelo nome do objeto, o Fabric usa a identidade do workspace para autenticar, e as credenciais nunca aparecem no código.

Isso tem uma implicação importante para ambientes de CI/CD: você pode ter Connection Objects com o mesmo nome em workspaces de desenvolvimento, homologação e produção, apontando para recursos diferentes, mas com a mesma lógica de referência no código. O notebook não muda entre ambientes, só o Connection Object muda.

## A ordem de configuração

Esse é o ponto que a maioria das documentações não deixa claro o suficiente. Tem uma sequência que precisa ser respeitada, e pular etapas vai resultar em erros que parecem aleatórios.

## 1. Habilitar o Workspace Identity no workspace

No portal do Fabric, dentro das configurações do workspace, você precisa habilitar explicitamente o Workspace Identity. Isso cria a identidade gerenciada associada ao workspace. Sem esse passo, nenhuma das etapas seguintes vai funcionar.

## 2. Conceder permissões no recurso de destino

Depois que a identidade existe, você precisa ir até o recurso alvo (um Storage Account no Azure, por exemplo) e adicionar a identidade do workspace como principal com as permissões necessárias. Se for um ADLS Gen2, tipicamente você vai adicionar a identidade no IAM com o role de `Storage Blob Data Contributor` ou `Reader`, dependendo do caso de uso.

## 3. Criar o Connection Object

Agora sim, com a identidade existindo e com permissões concedidas, você cria o Connection Object no Fabric. Durante a criação, você especifica o tipo de recurso, a URL de destino, e seleciona o Workspace Identity como método de autenticação.

## 4. Referenciar o Connection Object no notebook

Por fim, no notebook, você usa a API do Fabric para recuperar as credenciais a partir do Connection Object, sem nunca tocar em strings de senha ou tokens diretamente.

## Exemplo prático

Veja como fica na prática dentro de um notebook, acessando um Azure Data Lake Storage usando um Connection Object configurado com Workspace Identity:

```python
import notebookutils

# Recupera o token de acesso a partir do Connection Object configurado
# O nome aqui deve corresponder ao nome do Connection Object criado no Fabric
connection = notebookutils.credentials.getSecret(
    "https://sua-conta.dfs.core.windows.net", 
    "connection-object-name"
```

Para cenários mais diretos de acesso ao ADLS, você pode usar a integração nativa com `mssparkutils`:

```python
# Listando arquivos usando a identidade do workspace via Connection Object
files = notebookutils.fs.ls("abfss://container@storageaccount.dfs.core.windows.net/path/")
for f in files:
    print(f.name)
```

Quando o Connection Object está configurado corretamente, o Fabric resolve a autenticação por baixo dos panos. Você não vê token, não vê client secret, não vê nada que possa ser acidentalmente logado ou commitado no repositório.

Para conexões com recursos do Azure que exigem um token OAuth explícito, como APIs REST ou serviços que não têm integração nativa com o Spark, você pode solicitar o token diretamente:

```python
import notebookutils

# Obtendo token para o recurso Azure Storage via Workspace Identity
token = notebookutils.credentials.getToken("storage")

# Usando o token em uma chamada HTTP
import requests

headers = {
    "Authorization": f"Bearer {token}",
    "x-ms-version": "2020-08-04"
}

response = requests.get(
    "https://storageaccount.blob.core.windows.net/container?restype=container&comp=list",
    headers=headers
)
print(response.status_code)
```

Nesse caso, `getToken` usa a identidade do workspace para gerar um token válido para o escopo solicitado, sem que você precise gerenciar o ciclo de vida do token.

## Comparação com alternativas

Vale contextualizar por que essa abordagem é preferível às alternativas mais comuns:

**Hardcoded credentials**:

O pior cenário. Credenciais no código são um risco de segurança constante, não escalam bem entre ambientes, e são difíceis de rotacionar.

**Key Vault via Secret Scope (abordagem Databricks-style)**:

Funciona, mas adiciona uma dependência de infraestrutura adicional. Você ainda precisa gerenciar o acesso ao Key Vault em si, e a configuração é mais verbosa.

**Service Principal com Client Secret**:

Mais seguro que hardcoded, mas ainda requer gerenciar e rotacionar secrets. O Connection Object com Workspace Identity elimina completamente a necessidade de um secret.

**Usuário pessoal (identidade do desenvolvedor)**:

Funciona em dev, mas é um problema em produção. Se o usuário sair da empresa ou tiver suas permissões alteradas, os jobs param de funcionar. É um acoplamento que você não quer ter.

A combinação de Workspace Identity com Connection Objects é a abordagem mais limpa porque remove completamente o gerenciamento de credenciais da equação de desenvolvimento.

## Limitações e pontos de atenção

Nem tudo são flores. Alguns pontos que valem atenção:

O Workspace Identity é uma identidade por workspace. Se você tem múltiplos workspaces e quer isolar permissões entre eles, isso funciona bem. Mas se você precisa que a mesma identidade seja compartilhada entre workspaces por alguma razão, o modelo não foi feito para isso.

Outro ponto é que nem todos os tipos de recursos do Azure têm suporte nativo ao Connection Object no Fabric ainda. Para recursos mais exóticos ou APIs customizadas, você pode precisar usar o fluxo de `getToken` manualmente, o que ainda é seguro, mas remove a abstração do Connection Object.

Por fim, o debugging de problemas de permissão com Workspace Identity pode ser não óbvio. Quando uma chamada falha, o erro nem sempre deixa claro se o problema é na identidade, na permissão do recurso, ou na configuração do Connection Object. A ordem de verificação recomendada é: confirmar que o Workspace Identity está habilitado, confirmar que a identidade tem o role correto no IAM do recurso, e confirmar que o Connection Object está apontando para a URL correta.

Workspace Identity combinado com Connection Objects é a forma correta de autenticar notebooks do Fabric em produção. Não é complicado, mas tem uma sequência específica que precisa ser seguida, e pular etapas vai gerar erros que parecem misteriosos até você entender o modelo.

O aprendizado central aqui é: credentials no código são um cheiro ruim que precisa ser eliminado antes de qualquer promoção para produção. O Fabric tem a infraestrutura para isso hoje, o que significa que não há mais desculpa para manter o padrão de desenvolvimento que usa sua identidade pessoal em ambientes produtivos.

O próximo nível depois disso é integrar Connection Objects com pipelines de dados e garantir que a lógica de autenticação é consistente em todos os artefatos do workspace, não só nos notebooks. Mas isso é conversa para outro artigo.
