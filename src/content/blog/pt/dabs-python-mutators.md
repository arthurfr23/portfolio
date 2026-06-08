---
title: 'DABs Python Mutators: como garantir configuração consistente em 50 jobs sem copy-paste'
description: 'À medida que um projeto Databricks cresce, o número de jobs no bundle cresce junto. Dez jobs viram vinte, vinte viram cinquenta. E junto com o…'
date: 2026-05-05
tags: ['Data Engineering', 'Databricks']
canonical: 'https://medium.com/@arthurfr23/dabs-python-mutators-como-garantir-configura%C3%A7%C3%A3o-consistente-em-50-jobs-sem-copy-paste-c61e467c0ff0'
---

À medida que um projeto Databricks cresce, o número de jobs no bundle cresce junto. Dez jobs viram vinte, vinte viram cinquenta. E junto com o crescimento vem um problema que qualquer time de plataforma conhece: inconsistência de configuração.

Um job sem tag de custo. Outro sem notificação de falha. Um terceiro usando a cluster policy errada porque o dev copiou o YAML de um bundle antigo. Esses problemas não aparecem em desenvolvimento, aparecem em produção, na hora errada, geralmente descobertos por uma planilha de FinOps que aponta um centro de custo desconhecido.

O padrão comum de resolver isso é adicionar ao PR checklist: “verificou as tags?”, “configurou notificação?”. Funciona por um tempo. Depois de um crescimento de equipe ou uma semana de deploy intenso, alguém esquece.

DABs Python Mutators resolvem esse problema na camada de deploy, não de revisão de código.

## O que são Python Mutators

Um mutator é uma classe Python que implementa uma interface específica do DABs SDK. Ele recebe o objeto de recursos do bundle (todos os jobs, pipelines, clusters definidos no `databricks.yml`) e retorna esse objeto modificado. Isso acontece durante o `bundle deploy`, antes que qualquer recurso seja criado ou atualizado no workspace.

O ciclo completo de um deploy com mutator:

```bash
bundle deploy
-> carrega databricks.yml e todos os arquivos de recurso
-> executa cada mutator registrado, em ordem
-> aplica o estado resultante no workspace
```

A diferença fundamental em relação a um script pós-deploy: o mutator roda antes da criação dos recursos, então ele pode rejeitar o deploy se alguma condição não for satisfeita. Você pode usar isso para enforcement com falha controlada.

## Configuração básica

Primeiro, o mutator precisa estar registrado no `databricks.yml`:

```yaml
bundle:
  name: meu-bundle
  mutators:
    - my_bundle.mutators.EnforceTagsMutator
    - my_bundle.mutators.EnforceNotificationsMutator
    - my_bundle.mutators.ValidateNamingMutator
```

Depois, cada classe no módulo Python:

```python
# my_bundle/mutators.py
from databricks.bundles.core import Mutator, Resources
from databricks.bundles.jobs import JobSettings

REQUIRED_TAGS = {
    "cost_center": "data-engineering",
    "team": "platform",
    "environment": None,  # None = obrigatório, sem default
}

class EnforceTagsMutator(Mutator):
    def apply(self, resources: Resources) -> Resources:
        for name, job in resources.jobs.items():
            missing = [
                tag for tag, default in REQUIRED_TAGS.items()
                if tag not in (job.tags or {}) and default is None
            ]
            if missing:
                raise ValueError(
                    f"Job '{name}' está sem as tags obrigatórias: {missing}"
                )
            job.tags = {
                **REQUIRED_TAGS,
                **(job.tags or {}),
            }
        return resources
```

Nesse exemplo, o mutator aplica defaults para tags com valor definido e falha o deploy se uma tag obrigatória (com `None` como valor) não estiver presente no YAML do job.

## Casos de uso práticos

## 1. Enforce de notificações de falha

```python
class EnforceNotificationsMutator(Mutator):
    def apply(self, resources: Resources) -> Resources:
        for name, job in resources.jobs.items():
            if not job.email_notifications:
                job.email_notifications = {}
            if not job.email_notifications.on_failure:
                job.email_notifications.on_failure = [
                    "oncall-data@empresa.com"
                ]
        return resources
```

Resultado: todo job que entra no bundle sai do deploy com notificação de falha configurada. O dev não precisa lembrar.

## 2. Cluster policy por ambiente

```python
import os

CLUSTER_POLICIES = {
    "dev": "policy-dev-shared",
    "staging": "policy-staging-cost-optimized",
    "prod": "policy-prod-performance",
}

class EnforceClusterPolicyMutator(Mutator):
    def apply(self, resources: Resources) -> Resources:
        env = os.environ.get("DATABRICKS_ENV", "dev")
        policy_name = CLUSTER_POLICIES[env]

        for name, job in resources.jobs.items():
            for task in (job.tasks or []):
                if task.new_cluster:
                    task.new_cluster.policy_id = (
                        self._resolve_policy_id(policy_name)
                    )
        return resources

    def _resolve_policy_id(self, policy_name: str) -> str:
        # busca o ID da policy via SDK
        from databricks.sdk import WorkspaceClient
        w = WorkspaceClient()
        policies = {p.name: p.policy_id for p in w.cluster_policies.list()}
        return policies[policy_name]
```

Esse mutator força a cluster policy correta dependendo do ambiente do deploy. Em dev você usa a policy compartilhada e barata, em prod a policy com as garantias de SLA.

## 3. Validação de naming convention antes do deploy

```python
import re

JOB_NAME_PATTERN = re.compile(r'^[a-z0-9_]+$')

class ValidateNamingMutator(Mutator):
    def apply(self, resources: Resources) -> Resources:
        violations = [
            name for name in resources.jobs
            if not JOB_NAME_PATTERN.match(name)
        ]
        if violations:
            raise ValueError(
                f"Jobs com naming inválido (esperado snake_case): {violations}"
            )
        return resources
```

Falha o deploy no CI se qualquer job não seguir o padrão de nomenclatura. Nenhuma pipeline de revisão manual necessária para esse check.

## O que muda no fluxo de CI/CD

Com mutators no bundle, o pipeline de CI passa a ter um passo de validação implícito:

```bash
git push -> CI trigger
  -> bundle validate    # valida o YAML
  -> bundle deploy --dry-run  # executa os mutators sem criar recursos
  -> testes de integração
  -> bundle deploy (prod)
```

O `--dry-run` executa os mutators e valida o estado resultante sem criar nada no workspace. Se um mutator lança exceção (tag faltando, naming errado), o CI falha antes de qualquer deploy.

Isso move a responsabilidade de configuração consistente do processo humano de revisão de PR para o processo automatizado de build.

## Limitações

**Scope é o bundle, não o workspace.**

Mutators operam sobre a definição declarativa dos recursos, não sobre o estado atual do workspace. Se um job existe no workspace mas não está no bundle, o mutator não enxerga esse job. Se você precisa validar estado real (por exemplo, verificar se uma cluster policy existe no workspace antes de aplicar), precisa usar o SDK dentro do mutator, o que cria dependência de conectividade em tempo de CI.

**Ordem importa.**

Mutators rodam na ordem declarada no `databricks.yml`. Se um mutator depende do resultado de outro (por exemplo, validar depois de aplicar defaults), a ordem de registro precisa refletir isso.

**Sem acesso a outputs de outros recursos.**

Se um job depende do output de outro recurso criado no mesmo bundle (por exemplo, o ID de um cluster), esse ID não está disponível durante a execução do mutator.

## Conclusão

Python Mutators no DABs resolvem um problema que cresce silenciosamente com o tamanho do bundle: inconsistência de configuração que ninguém percebe até aparecer numa planilha de custo ou num incidente sem notificação.

A implementação é direta, o ganho é imediato para qualquer bundle com mais de 10 jobs, e o enforcement no CI elimina a dependência de disciplina humana para configurações que deveriam ser invariantes.

O que ainda falta no modelo: a capacidade de mutators lerem estado externo de forma mais ergonômica (por exemplo, buscar IDs de políticas automaticamente por nome sem precisar inicializar o SDK manualmente). Essa parte ainda tem atrito e vai amadurecer nas próximas versões do DABs SDK.
