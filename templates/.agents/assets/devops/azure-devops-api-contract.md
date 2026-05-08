# Azure DevOps API Contract (Scriptless)

This file defines the API-first contract for DevOps agent execution.

## Authentication

- Use PAT-based Basic auth header.
- Header format:
  - `Authorization: Basic <base64(:PAT)>`
- Never log token values.

## Required API Version

- Use `api-version=7.1` unless endpoint-specific version is required.

## Repositories

### Create Repository

- Method: `POST`
- URL: `https://dev.azure.com/{organization}/{project}/_apis/git/repositories?api-version=7.1`
- Body:

```json
{
  "name": "{repoName}",
  "project": { "id": "{projectId}" },
  "defaultBranch": "refs/heads/main"
}
```

> **Why `main` as default:** Branch policies in this org are applied to the default branch. Setting `main` as default keeps `develop` unprotected so bootstrap pushes (code + `azure-pipelines.yml`) succeed without requiring a PR.

### List Repositories

- Method: `GET`
- URL: `https://dev.azure.com/{organization}/{project}/_apis/git/repositories?api-version=7.1`

## Pipelines

### Create Pipeline

- Method: `POST`
- URL: `https://dev.azure.com/{organization}/{project}/_apis/pipelines?api-version=7.1`
- Body (Azure Repos Git):

```json
{
  "name": "{pipelineName}",
  "configuration": {
    "type": "yaml",
    "path": "azure-pipelines.yml",
    "repository": {
      "id": "{repoId}",
      "type": "azureReposGit",
      "name": "{repoName}",
      "defaultBranch": "refs/heads/develop"
    }
  }
}
```

### Update Pipeline Name

- Method: `PATCH`
- URL: `https://dev.azure.com/{organization}/{project}/_apis/pipelines/{pipelineId}?api-version=7.1`
- Body:

```json
{
  "name": "{newName}"
}
```

## Variable Groups

### List Variable Groups

- Method: `GET`
- URL: `https://dev.azure.com/{organization}/{project}/_apis/distributedtask/variablegroups?api-version=7.1`

### Create Variable Group

- Method: `POST`
- URL: `https://dev.azure.com/{organization}/{project}/_apis/distributedtask/variablegroups?api-version=7.1`
- Body:

```json
{
  "name": "{appName}-dev",
  "type": "Vsts",
  "variables": {
    "buildAgentPool": { "value": "Azure Pipelines", "isSecret": false }
  }
}
```

### Update Variable Group (idempotent merge)

- Method: `PUT`
- URL: `https://dev.azure.com/{organization}/{project}/_apis/distributedtask/variablegroups/{groupId}?api-version=7.1`
- Body must include full variable set.

## Execution Rules

1. Read-before-write for idempotency.
2. Retry on `429` and transient `5xx` with backoff.
3. Treat `409` conflicts as "already exists" and resolve by lookup.
4. Do not execute `.ps1` helper scripts from assets.

## Naming Rules

1. Pipelines:
   - `{appName}-frontend`
   - `{appName}-backend`
2. Variable groups:
   - `{appName}-dev`
   - `{appName}-prod`
