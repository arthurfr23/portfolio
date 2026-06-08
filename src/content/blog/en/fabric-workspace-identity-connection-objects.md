---
title: 'Secure authentication in Microsoft Fabric notebooks with Workspace Identity and Connection Objects'
description: 'If you work with notebooks in Microsoft Fabric, you have probably hit the classic situation: during development everything works…'
date: 2026-06-01
tags: ['Databricks', 'Data Engineering']
canonical: 'https://medium.com/@arthurfr23/autentica%C3%A7%C3%A3o-segura-em-notebooks-do-microsoft-fabric-com-workspace-identity-e-connection-objects-94b5315b6909'
---

If you work with notebooks in Microsoft Fabric, you have probably hit the classic situation: during development everything works perfectly because the notebook runs under your own identity. You access Azure Data Lake, Key Vault, the external API, and move on. Then comes the moment to promote to production, and the problems begin. Your personal identity should not have access to production resources. Worse still, if someone hardcodes credentials directly in the notebook, you have a serious security risk waiting to blow up.

The problem is not new in the data world. Any engineer who has worked with production data pipelines knows that managing authentication securely is one of the most tedious yet most critical parts of the job. In Fabric, the answer goes through two concepts that, together, solve this problem elegantly: **Workspace Identity** and **Connection Objects**.

The catch is that the official documentation covers each of these components in isolation. In practice, what you need is to understand how they fit together, in which order things have to happen, and where the traps are that will make you lose hours of debugging. That is exactly what this article covers.

## What Workspace Identity is

Workspace Identity is, essentially, a managed identity associated with your Fabric workspace. Instead of authenticating with your user credentials (which creates a dangerous coupling between you and production resources), the workspace itself has its own identity, which can be granted permissions on Azure resources.

This is analogous to Managed Identities in Azure, and in fact that is exactly what happens under the hood. The difference is that you can now use this identity inside the execution context of notebooks, Spark jobs, and other Fabric artifacts.

The practical benefit is direct: you remove credentials from the code, reduce the attack surface, and make permission rotation easier without having to change notebooks. If a resource needs to be accessed by production, you grant permission to the workspace, not to your personal user.

## Connection Objects

Workspace Identity solves half of the problem. The other half is how you reference this identity inside your notebooks in a reusable way that is decoupled from the code. This is where **Connection Objects** come in.

A Connection Object in Fabric is an artifact that encapsulates the connection information to an external resource, including which authentication method to use. When you create a Connection Object configured to use Workspace Identity, it acts as a bridge: the notebook requests the connection by the object's name, Fabric uses the workspace identity to authenticate, and the credentials never appear in the code.

This has an important implication for CI/CD environments: you can have Connection Objects with the same name in development, staging, and production workspaces, pointing to different resources, but with the same reference logic in the code. The notebook does not change between environments, only the Connection Object changes.

## The configuration order

This is the point that most documentation does not make clear enough. There is a sequence that must be respected, and skipping steps will result in errors that look random.

## 1. Enable Workspace Identity on the workspace

In the Fabric portal, inside the workspace settings, you need to explicitly enable Workspace Identity. This creates the managed identity associated with the workspace. Without this step, none of the following steps will work.

## 2. Grant permissions on the target resource

Once the identity exists, you need to go to the target resource (a Storage Account in Azure, for example) and add the workspace identity as a principal with the required permissions. If it is an ADLS Gen2, you will typically add the identity in IAM with the `Storage Blob Data Contributor` or `Reader` role, depending on the use case.

## 3. Create the Connection Object

Now, with the identity existing and permissions granted, you create the Connection Object in Fabric. During creation, you specify the resource type, the target URL, and select Workspace Identity as the authentication method.

## 4. Reference the Connection Object in the notebook

Finally, in the notebook, you use the Fabric API to retrieve the credentials from the Connection Object, without ever touching password strings or tokens directly.

## A practical example

Here is what it looks like in practice inside a notebook, accessing an Azure Data Lake Storage using a Connection Object configured with Workspace Identity:

```python
import notebookutils

# Retrieves the access token from the configured Connection Object
# The name here must match the name of the Connection Object created in Fabric
connection = notebookutils.credentials.getSecret(
    "https://your-account.dfs.core.windows.net", 
    "connection-object-name"
```

For more straightforward ADLS access scenarios, you can use the native integration with `mssparkutils`:

```python
# Listing files using the workspace identity via the Connection Object
files = notebookutils.fs.ls("abfss://container@storageaccount.dfs.core.windows.net/path/")
for f in files:
    print(f.name)
```

When the Connection Object is configured correctly, Fabric resolves the authentication under the hood. You do not see a token, you do not see a client secret, you do not see anything that could be accidentally logged or committed to the repository.

For connections to Azure resources that require an explicit OAuth token, such as REST APIs or services that do not have native Spark integration, you can request the token directly:

```python
import notebookutils

# Getting a token for the Azure Storage resource via Workspace Identity
token = notebookutils.credentials.getToken("storage")

# Using the token in an HTTP call
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

In this case, `getToken` uses the workspace identity to generate a token valid for the requested scope, without you having to manage the token's lifecycle.

## Comparison with alternatives

It is worth contextualizing why this approach is preferable to the more common alternatives:

**Hardcoded credentials**:

The worst case. Credentials in the code are a constant security risk, do not scale well across environments, and are hard to rotate.

**Key Vault via Secret Scope (Databricks-style approach)**:

It works, but it adds an additional infrastructure dependency. You still have to manage access to the Key Vault itself, and the setup is more verbose.

**Service Principal with Client Secret**:

More secure than hardcoded, but it still requires managing and rotating secrets. The Connection Object with Workspace Identity completely eliminates the need for a secret.

**Personal user (developer identity)**:

It works in dev, but it is a problem in production. If the user leaves the company or has their permissions changed, the jobs stop working. It is a coupling you do not want to have.

The combination of Workspace Identity with Connection Objects is the cleanest approach because it completely removes credential management from the development equation.

## Limitations and points of attention

Not everything is rosy. A few points worth attention:

Workspace Identity is a per-workspace identity. If you have multiple workspaces and want to isolate permissions between them, this works well. But if you need the same identity to be shared across workspaces for some reason, the model was not built for that.

Another point is that not all Azure resource types have native Connection Object support in Fabric yet. For more exotic resources or custom APIs, you may need to use the `getToken` flow manually, which is still secure, but removes the Connection Object abstraction.

Finally, debugging permission problems with Workspace Identity can be non-obvious. When a call fails, the error does not always make it clear whether the problem is in the identity, in the resource permission, or in the Connection Object configuration. The recommended verification order is: confirm that Workspace Identity is enabled, confirm that the identity has the correct role in the resource's IAM, and confirm that the Connection Object is pointing to the correct URL.

Workspace Identity combined with Connection Objects is the correct way to authenticate Fabric notebooks in production. It is not complicated, but it has a specific sequence that must be followed, and skipping steps will generate errors that look mysterious until you understand the model.

The core takeaway here is: credentials in the code are a bad smell that must be eliminated before any promotion to production. Fabric has the infrastructure for this today, which means there is no longer any excuse to keep the development pattern that uses your personal identity in production environments.

The next level after that is integrating Connection Objects with data pipelines and ensuring that the authentication logic is consistent across all workspace artifacts, not just notebooks. But that is a conversation for another article.
