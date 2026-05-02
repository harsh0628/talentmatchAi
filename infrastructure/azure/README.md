# Azure Infrastructure (Bicep)

This folder provisions ACR, AKS, and a Log Analytics workspace.

## Prerequisites

- Azure CLI
- Bicep (`az bicep install`)

## Deploy

```bash
az group create -n <resource-group> -l <location>
az deployment group create -g <resource-group> -f main.bicep -p main.parameters.json
```

## Post-Deploy

```bash
az aks get-credentials -g <resource-group> -n <aks-name> --overwrite-existing
az aks update -g <resource-group> -n <aks-name> --attach-acr <acr-name>
```
