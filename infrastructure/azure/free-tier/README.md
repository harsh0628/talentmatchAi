# Azure Free Tier Deployment (Student Subscription)

This setup uses only the free-tier SKUs you listed.

## What It Provisions

- **Compute:** One Linux VM (default `Standard_B2s`) with Docker installed.
- **Database:** Cosmos DB (Mongo API) with free tier enabled + SQL Database S0.
- **Storage:** Storage account (Standard_LRS) with a blob container and Azure Files share.
- **AI/ML:** Cognitive Services free tier (Text Analytics, Computer Vision, Translator).

## Deploy

```bash
az group create -n <resource-group> -l <location>
az deployment group create -g <resource-group> -f main.bicep -p main.parameters.json
```

The VM bootstrap now clones the app repository, creates the runtime `.env`, and starts `docker-compose.azure.yml` automatically on first boot.

## Get VM Public IP

```bash
az vm list-ip-addresses -g <resource-group> -n talentmatch-vm --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" -o tsv
```

## Get Keys/Connection Strings

```bash
az cosmosdb keys list -g <resource-group> -n <cosmos-account> --type connection-strings -o tsv
az storage account show-connection-string -g <resource-group> -n <storage-account> -o tsv
az cognitiveservices account keys list -g <resource-group> -n <text-analytics-name> --query "key1" -o tsv
```

## App Deployment on the VM

1. SSH into the VM: `ssh azureuser@<vm-ip>`
2. Clone the repo: `git clone https://github.com/<org>/<repo>.git /opt/talentmatch`
3. Create `/opt/talentmatch/.env` with your secrets:

```
MONGODB_URI=<cosmos-connection-string>
CLIENT_URL=http://<vm-ip>
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
GEMINI_API_KEY=<optional>
```

4. Start the containers:

```bash
cd /opt/talentmatch
docker compose -f docker-compose.azure.yml up -d --build
```

If you use the updated free-tier Bicep template, steps 2 to 4 happen automatically through cloud-init.

The site will be available at `http://<vm-ip>`.
