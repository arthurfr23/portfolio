---
title: 'AI/BI Dashboards and DABs: the lesson I almost learned the hard way'
description: 'There is a behavior in Databricks that looks like a bug but is a feature, and that almost no one discovers until they lose a dashboard in production.'
date: 2026-05-05
tags: ['Data Engineering', 'Databricks']
canonical: 'https://medium.com/@arthurfr23/ai-bi-dashboards-e-dabs-a-li%C3%A7%C3%A3o-que-aprendi-quase-da-pior-forma-b78acfb07f13'
---

There is a behavior in Databricks that looks like a bug but is a feature, and that almost no one discovers until they lose a dashboard in production.

This week an engineer posted on Reddit describing exactly this situation: AI/BI dashboards deployed for clients, checked into Git, apparently under control. When switching branches to work on another feature, the dashboards disappeared from the workspace. Before a recovery plan even existed, the dashboards were inaccessible to clients.

The reason is the binding model between Git and the workspace in Databricks. And the solution, which may seem laborious at first glance, is the correct one for any resource that goes to production: deploy via Databricks Asset Bundles.

## How Git sync works in Databricks

When you check out a file in Databricks Git, including `.lvdash.json` dashboards, the file becomes bound to the active branch. This means the workspace displays the resource while that branch is active in the workspace context.

The behavior becomes problematic when you switch branches:

```bash
Branch: feature/new-dashboard
-> dashboard appears in the workspace
-> clients access it
git checkout feature/other-feature
-> Databricks Git sync updates the workspace
-> dashboard disappears because it does not exist in this branch
-> clients without access
```

This is not an implementation bug. The Databricks model is explicit: Git is the source of truth, and the workspace reflects the state of the branch. The problem is that this model works well for notebooks in development and poorly for resources shared with users who do not know the difference between branches.

The documentation mentions this behavior, but it is the kind of thing no one reads until they need to.

## The solution: dashboards as declarative resources in DABs

Databricks Asset Bundles treats resources as declarative code managed independently of the active branch in the workspace. A dashboard in DABs is created and maintained in the workspace when you run `bundle deploy`, and it stays there until it is explicitly removed via `bundle destroy`.

This is the fundamental difference:

```
Git sync: workspace = state of the current branch
DABs: workspace = state of the last deploy
```

For a production resource that clients access, the DABs model is the correct one.

## Dashboard configuration in the bundle

The bundle structure to include a dashboard:

```yaml
# databricks.yml
bundle:
  name: analytics-platform

targets:
  dev:
    workspace:
      host: https://adb-xxx.azuredatabricks.net
  prod:
    workspace:
      host: https://adb-yyy.azuredatabricks.net

resources:
  dashboards:
    sales_overview:
      display_name: "Sales Overview"
      file_path: ./dashboards/sales_overview.lvdash.json
      embed_credentials: false
      warehouse_id: ${var.warehouse_id}

    revenue_by_region:
      display_name: "Revenue by Region"
      file_path: ./dashboards/revenue_by_region.lvdash.json
      embed_credentials: false
      warehouse_id: ${var.warehouse_id}
```

The `.lvdash.json` file is the exported AI/BI Dashboard format. You export it from the workspace, version it in Git like any other file, and DABs takes care of the deploy.

## Workflow with DABs

With the dashboard in the bundle, the development flow changes:

```bash
# Develop in the workspace normally
# When satisfied, export the dashboard
databricks dashboards export <dashboard-id> --output ./dashboards/

# Version it in Git
git add dashboards/sales_overview.lvdash.json
git commit -m "update sales overview: add cohort chart"

# Deploy to staging
databricks bundle deploy --target dev

# Validate in the dev environment
# PR review, merge to main

# Deploy to production
databricks bundle deploy --target prod
```

From the first `bundle deploy`, the dashboard exists in the workspace independently of the branch. You can check out any branch in your local environment without affecting what is deployed.

Rollback is also simple: you go back to a previous commit and deploy again.

```bash
git checkout <previous-commit>
databricks bundle deploy --target prod
```

## Dashboard permissions in the bundle

A point that is not obvious: you can also declare the dashboard's permissions in the bundle, ensuring that the right clients and teams have access without manual configuration in the workspace:

```yaml
resources:
  dashboards:
    sales_overview:
      display_name: "Sales Overview"
      file_path: ./dashboards/sales_overview.lvdash.json
      warehouse_id: ${var.warehouse_id}
      permissions:
        - level: CAN_VIEW
          group_name: external-clients
        - level: CAN_EDIT
          group_name: data-team
        - level: IS_OWNER
          user_name: arthur@company.com
```

This ensures that a new deploy does not reset permissions configured manually in the workspace, which is another common source of problems in environments with multiple teams.

## What to learn from this kind of incident

The problem of disappearing dashboards is an example of a larger class of problems: platform behaviors that make sense within a specific mental model (Git as the source of truth) but surprise those who do not know that model.

A few principles this case illustrates:

**Any production resource accessed by users must be managed as infrastructure, not as a working file.**

A development notebook can live in Git sync without a problem. A dashboard that clients access needs controlled deployment.

**DABs is the correct mechanism for this.**

Not because it is more modern, but because the explicit deploy model is safer for shared resources than the implicit Git sync model.

**Testing the deploy in staging before production prevents this class of problem.**

If the flow includes `bundle deploy --target dev` before production, you see the dashboard appear and disappear in a controlled way before it affects a real client.

## Conclusion

The behavior of branch-bound dashboards is not a Databricks bug. It is a consequence of the Git sync model that makes sense for development but not for shared production resources.

The solution is not to avoid Git sync, it is to clearly separate what is a development resource from what is a production resource. Development lives in Git sync. Production lives in the bundle.

For those starting with AI/BI Dashboards: configure the bundle from the very first dashboard that goes to a client. The cost of setting up DABs early is low. The cost of migrating after an incident like this is much higher, not only technically, but in the trust of those who were using the dashboard.
