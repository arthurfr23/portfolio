---
title: 'Evolving agentic applications in Microsoft Fabric: automated deployment and integration with Data Agents'
description: 'Over the last few months, I have closely followed how Microsoft Fabric has accelerated its evolution to compete directly in the AI and agents space.…'
date: 2026-04-26
tags: ['Microsoft Fabric', 'AI', 'Data Engineering']
canonical: 'https://medium.com/@arthurfr23/evoluindo-aplica%C3%A7%C3%B5es-ag%C3%AAnticas-no-microsoft-fabric-deploy-automatizado-e-integra%C3%A7%C3%A3o-com-data-f0c3e57b28ab'
---

## Introduction

Over the last few months, I have closely followed how Microsoft Fabric has accelerated its evolution to compete directly in the AI and agents space. It is no secret that the market is in an intense race: Databricks launched the Mosaic AI Agent Framework, AWS has Bedrock Agents, and OpenAI keeps pushing the state of the art with new orchestration capabilities, and Claude, well… needless to say. Fabric, which started as a unified data and analytics platform, has clearly decided that it will not stay out of this dispute.

There are already a few articles discussing the classic operational problem: what happens when an agent leaves the POC and starts interacting with real users, real data, and business processes at scale? Observability, governance, evaluation. All of that is essential, but there is a layer prior to that discussion that needs to be addressed first: how do you structure the lifecycle of these agentic applications in a reproducible way? And how do you connect these agents directly to your data ecosystem without building integration hacks?

This is exactly what Microsoft has been addressing in the latest Fabric updates: a set of capabilities that ranges from deploy automation to the formal introduction of the so-called **Data Agents**, which allow agents to talk to your data natively within the platform. I will break down each of these fronts with the level of detail they deserve.

## Technical development

## The lifecycle problem in agentic applications

Before talking about the solutions, it is important to understand the problem. Agentic applications have a much higher lifecycle complexity than a traditional predictive model. A classification model has a relatively linear pipeline: data collection, training, validation, deployment, monitoring. An agent, on the other hand, involves multiple orchestrated components: language models, external tools, memory, state management, and frequently multiple sub-agents cooperating.

This means the concept of a "version" of an agentic application is fuzzier. You can change the system prompt, swap the base model, add a new tool, or alter the orchestration logic, and any of these changes can dramatically impact the observed behavior. Without an automated and traceable deployment structure, you quickly lose the ability to correlate behavior changes with configuration changes.

## Automated deployment in Fabric: CI/CD for agents

Fabric has been moving in the direction of treating agentic applications as first-class artifacts within its deployment ecosystem. Git integration (supporting both Azure DevOps and GitHub) lets you version not only notebooks and pipelines, but also the agent definitions, including model configurations, tool definitions, and prompts.

The automated deployment structure leverages Fabric's REST APIs to orchestrate promotions between workspaces, which is the functional equivalent of development, staging, and production environments. A typical flow looks like this:

```yaml
# Example Azure DevOps pipeline to deploy an agent in Fabric
trigger:
  branches:
    include:
      - main
      - release/*

stages:
  - stage: DeployDev
    jobs:
      - job: DeployAgentDev
        steps:
          - task: AzureCLI@2
            displayName: 'Deploy Agent to Dev Workspace'
            inputs:
              azureSubscription: '$(AZURE_SUBSCRIPTION)'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Authentication via Service Principal
                az login --service-principal \
                  -u $(SP_CLIENT_ID) \
                  -p $(SP_CLIENT_SECRET) \
                  --tenant $(TENANT_ID)
                
                # Deploy via Fabric REST API
                curl -X POST \
                  "https://api.fabric.microsoft.com/v1/workspaces/$(DEV_WORKSPACE_ID)/items" \
                  -H "Authorization: Bearer $(az account get-access-token --query accessToken -o tsv)" \
                  -H "Content-Type: application/json" \
                  -d @agent_definition.json

  - stage: DeployProd
    dependsOn: DeployDev
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - job: DeployAgentProd
        steps:
          - task: AzureCLI@2
            displayName: 'Promote Agent to Production'
            inputs:
              azureSubscription: '$(AZURE_SUBSCRIPTION)'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Using Fabric's Deployment Pipeline API
                curl -X POST \
                  "https://api.fabric.microsoft.com/v1/pipelines/$(PIPELINE_ID)/deploy" \
                  -H "Authorization: Bearer $(az account get-access-token --query accessToken -o tsv)" \
                  -H "Content-Type: application/json" \
                  -d '{
                    "sourceStageOrder": 1,
                    "targetStageOrder": 2,
                    "items": [{"objectId": "$(AGENT_ITEM_ID)", "objectType": "AISkill"}]
                  }'
```

This flow solves a concrete problem that any team that has operated LLMs in production knows well: the lack of traceability between what is running in prod and what is in the repository.

## Data Agents: native integration with the data ecosystem

This is, in my opinion, the most interesting part of the recent updates. **Data Agents** in Fabric are agents that have native access to the platform's data artifacts: lakehouses, warehouses, Power BI semantic models, and eventually other sources managed by OneLake.

The value proposition is direct: instead of manually building an agent with database access via JDBC, writing abstraction layers to deal with dynamic schemas, and managing context about which tables exist, Fabric offers an integration layer that already understands the structure of your data. The agent can receive questions in natural language and generate queries over your lakehouse or warehouse without you having to build all that plumbing.

The internal workflow follows a logic similar to classic Text-to-SQL, but with some important differences:

```python
# Conceptual example of how a Data Agent interacts with a Lakehouse in Fabric
# using the Azure AI SDK and Fabric integration

from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

# Client initialization
client = AIProjectClient(
    subscription_id="<subscription_id>",
    resource_group_name="<resource_group>",
    project_name="<project_name>",
    credential=DefaultAzureCredential()
)

# The Data Agent in Fabric already has the Lakehouse schema as context
# The system automatically injects metadata of the relevant tables

def query_data_agent(user_question: str, agent_id: str) -> dict:
    """
    Sends a question to the Data Agent configured in Fabric.
    The agent internally resolves:
    1. Identification of the relevant tables in the Lakehouse
    2. Generation of SQL/DAX based on the schema
    3. Execution of the query
    4. Formatting of the response
    """
    thread = client.agents.create_thread()
    
    message = client.agents.create_message(
        thread_id=thread.id,
        role="user",
        content=user_question
    )
    
    run = client.agents.create_and_process_run(
        thread_id=thread.id,
        assistant_id=agent_id
    )
    
    if run.status == "completed":
        messages = client.agents.list_messages(thread_id=thread.id)
        return {
            "status": "success",
            "response": messages.get_last_text_message_by_role("assistant"),
            "run_id": run.id  # For traceability and later evaluation
        }
    else:
        return {
            "status": "failed",
            "error": run.last_error,
            "run_id": run.id
        }

# Usage
result = query_data_agent(
    user_question="What was the total sales by region in the last quarter?",
    agent_id="<data_agent_id_in_fabric>"
)
print(result["response"])
```

## Comparison with alternative approaches

It is worth contextualizing where Fabric positions itself relative to other platforms:

**Databricks + Mosaic AI:** Databricks has Unity Catalog as the foundation for giving agents context about the available data. The difference is that Databricks offers more flexibility in orchestration (via LangChain, LlamaIndex, or its own Agent Framework), but requires more manual configuration. Fabric is betting on a more guided and integrated experience, with less friction for those who already live in the Microsoft ecosystem.

**Azure AI Foundry:** Fabric and Azure AI Foundry are converging in their capabilities. The distinction is becoming thinner: Fabric brings the data layer, AI Foundry brings the model and evaluation layer. Microsoft is clearly orchestrating these services to work together, with Fabric serving as the unified data plane for enterprise agentic applications.

**Limitations:** The Text-to-SQL and Text-to-DAX generated by Data Agents still has known limitations in complex queries with multiple joins, business logic not obvious in the schema, or when tables have ambiguous naming. The quality of the result is strongly dependent on how the schema is documented (column descriptions, well-named tables, rich metadata in the Lakehouse).

## Practical example: configuring a Data Agent in Fabric

The process of creating a Data Agent in Fabric today follows these steps:

**1. Create the AI Skill artifact in the Workspace:**

Inside the Fabric workspace, you create an item of type "AI Skill" (the Data Agent). In this process, you select which Lakehouse or Warehouse data sources the agent will have access to.

**2. Enrich the schema context:**

This step is critical and frequently neglected. You should add descriptions to the tables and columns the agent will use. Fabric uses these descriptions to improve the accuracy of SQL generation.

```sql
-- Example of how to document your tables in the Fabric Warehouse
-- to improve the quality of the Data Agent

-- Adding descriptions via T-SQL in the Fabric Warehouse
EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Sales fact table consolidated daily. 
               Granularity: one row per sale transaction. 
               Refreshed every day at 06:00 via the ETL pipeline.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'fct_sales';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Net sale amount after discounts, in BRL.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'fct_sales',
    @level2type = N'COLUMN', @level2name = N'net_amount_brl';
```

**3. Configure system instructions:**

The Data Agent accepts a system prompt where you can define behavior constraints, business context, and guidance on how to interpret ambiguous questions. Think of it as the "contract" between the agent and the data domain it represents.

**4. Test and evaluate:**

Fabric offers an integrated chat interface to test the agent directly. For systematic evaluation, you can integrate with the evaluation capabilities of Azure AI Foundry, capturing question/answer pairs and assessing the correctness of the generated queries.

**5. Expose via API:**

Once validated, the Data Agent can be exposed as a REST API that your applications consume. This API integrates with Entra ID authentication, which solves the access-control problem without having to manage custom tokens.

## Conclusion

What becomes clear when analyzing this evolution of Fabric is that Microsoft is playing a convergence game. The platform is consolidating what previously required multiple distinct services (a data warehouse, an ML service, an agent orchestration layer, and an API gateway) into a unified experience.

For teams already in the Microsoft ecosystem, this is genuinely attractive. The integration friction is lower, governance via Microsoft Purview already exists, and the adoption curve for those who know Power BI and Azure Data Factory is reasonable.

For teams evaluating Fabric as a new platform, the points of attention remain the same as always: the maturity of the capabilities is still in accelerated evolution (which means some features still have operational limitations), and the customization flexibility tends to be lower than in more open stacks like Databricks or LangChain-based solutions.

The natural next step in this series is observability and evaluation in production, because deployment is only the beginning. Knowing whether your Data Agent is responding correctly, identifying when it hallucinates a query or misinterprets a business question, and having mechanisms to fix it without a full release cycle, that is the problem that will separate the mature implementations from the experimental ones.

And Fabric, by all indications, knows this and is building in that direction.
