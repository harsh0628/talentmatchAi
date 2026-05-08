# TalentMatch AI - Azure Deployment Guide

**Last Updated:** May 8, 2026  
**Project Status:** ✅ Verified & Ready for Deployment

## 🎯 Deployment Overview

This document covers complete end-to-end deployment of TalentMatch AI to Azure using:
- **Backend**: Azure Functions (Serverless)
- **Frontend**: Azure Static Web Apps
- **Database**: Azure Cosmos DB (MongoDB compatibility)
- **CI/CD**: GitHub Actions

---

## ✅ Pre-Deployment Verification Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Frontend Build** | ✅ PASS | Vite builds successfully (230KB bundle) |
| **Backend Build** | ✅ PASS | Express app starts on port 5000 |
| **Dependencies** | ✅ PASS | All npm packages installed |
| **Node Version** | ✅ PASS | v24.12.0 (Requires 20+) |
| **npm Version** | ✅ PASS | 11.7.0 |
| **Security Middleware** | ✅ PASS | Helmet, CORS, Rate Limiting configured |
| **Health Endpoint** | ✅ PASS | `/health` endpoint available |
| **Metrics Endpoint** | ✅ PASS | Prometheus metrics at `/metrics` |

---

## 🚀 Phase 1: Azure Setup (One-Time)

### 1.1 Prerequisites
```powershell
# Install Azure CLI
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows

# Verify installation
az --version
```

### 1.2 Azure Subscription & Resource Group
```powershell
# Login to Azure
az login

# Create resource group (if not exists)
az group create `
  -n talentmatch-rg `
  -l eastus

# Set default resource group
az config set defaults.group=talentmatch-rg
```

### 1.3 Create Storage Account (for Function App)
```powershell
$storageAccountName = "talentmatchstorage"
$storageAccountKey = $(az storage account create `
  -g talentmatch-rg `
  -n $storageAccountName `
  --sku Standard_LRS `
  --query "keys[0].value" -o tsv)

Write-Host "Storage Account Created: $storageAccountName"
Write-Host "Connection String needed for Function App"
```

### 1.4 Create Azure Function App
```powershell
# Create App Service Plan
az appservice plan create `
  -g talentmatch-rg `
  -n talentmatch-plan `
  --sku B1 `
  --is-linux

# Create Function App
az functionapp create `
  -g talentmatch-rg `
  -n talentmatchaibackend `
  --storage-account $storageAccountName `
  --runtime node `
  --runtime-version 20 `
  --plan talentmatch-plan `
  --functions-version 4

Write-Host "Function App Created: talentmatchaibackend"
```

### 1.5 Create Cosmos DB (MongoDB Compatible)
```powershell
# Create Cosmos DB Account
az cosmosdb create `
  -g talentmatch-rg `
  -n talentmatch-cosmos `
  --kind MongoDB `
  --server-version "7.0"

# Get connection string
$cosmosConnection = $(az cosmosdb keys list `
  -g talentmatch-rg `
  -n talentmatch-cosmos `
  --type connection-strings `
  --query "connectionStrings[0].connectionString" -o tsv)

Write-Host "Cosmos DB Connection String:"
Write-Host $cosmosConnection
```

### 1.6 Create Azure Static Web App
```powershell
# Create Static Web App
az staticwebapp create `
  -g talentmatch-rg `
  -n talentmatch-web `
  -s https://github.com/YOUR_USERNAME/Project_Advanced `
  --branch main `
  --login-with-github

Write-Host "Static Web App Created"
Write-Host "Follow GitHub prompt to authorize Azure access"
```

---

## 🔐 Phase 2: Configure Environment Variables

### 2.1 Function App Environment Variables

In Azure Portal or via CLI:

```powershell
# Set environment variables for Function App
az functionapp config appsettings set `
  -g talentmatch-rg `
  -n talentmatchaibackend `
  --settings `
    MONGODB_URI=$cosmosConnection `
    CLIENT_URL="https://talentmatch-web.azurestaticapps.net" `
    NODE_ENV="production" `
    JWT_ACCESS_SECRET="$(openssl rand -hex 32)" `
    JWT_REFRESH_SECRET="$(openssl rand -hex 32)" `
    JWT_ACCESS_EXPIRES_IN="1d" `
    JWT_REFRESH_EXPIRES_IN="7d" `
    JWT_REFRESH_COOKIE_NAME="tm_refresh_token" `
    JWT_REFRESH_COOKIE_MAX_AGE_MS="604800000" `
    AUTH_MAX_FAILED_LOGIN_ATTEMPTS="5" `
    AUTH_LOCKOUT_MINUTES="30" `
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY" `
    GEMINI_MODEL="gemini-2.5-flash" `
    AI_REQUEST_TIMEOUT_MS="20000" `
    AI_ENABLE_HEURISTIC_FALLBACK="true"
```

### 2.2 Get Function App Publish Profile

```powershell
# Get publish profile (will be used in GitHub secret)
az functionapp deployment list-publishing-profiles `
  -g talentmatch-rg `
  -n talentmatchaibackend `
  --xml > PublishSettings.xml

Write-Host "Publish profile saved to PublishSettings.xml"
```

---

## 🔑 Phase 3: Configure GitHub Secrets

### 3.1 Add Publish Profile Secret

1. Go to: `https://github.com/YOUR_USERNAME/Project_Advanced/settings/secrets/actions`
2. Create new secret: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_TALENTMATCHAI_BACKEND`
3. Paste contents of `PublishSettings.xml`

### 3.2 Verify GitHub Workflow

Check: [`.github/workflows/main_talentmatchaibackend.yml`]

```yaml
# Current workflow:
# - Triggers on: push to main, manual dispatch
# - Installs dependencies
# - Builds project
# - Deploys to Function App via publish profile
```

---

## 🚢 Phase 4: Deploy Backend (API)

### Option A: Automatic Deployment (GitHub Actions)
```bash
# Simply push to main branch
git add .
git commit -m "Deploy to Azure"
git push origin main

# Monitor at: GitHub > Actions > Build and deploy Node.js project
```

### Option B: Manual Deployment
```powershell
# Navigate to project
cd e:\Github\Project_Advanced\apps\api

# Build function app
npm install
npm run build --if-present

# Deploy (requires Azure CLI logged in)
func azure functionapp publish talentmatchaibackend
```

### 4.1 Verify Backend Deployment
```powershell
# Get function URL
$functionUrl = $(az functionapp show `
  -g talentmatch-rg `
  -n talentmatchaibackend `
  --query "defaultHostName" -o tsv)

# Test health endpoint
curl "https://$functionUrl/api/health"

# Should return: {"success": true, "message": "API is healthy"}
```

---

## 🎨 Phase 5: Deploy Frontend (Web App)

### 5.1 Configure Static Web App Build Settings

Create/update `staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "index.html"
  },
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

### 5.2 Deploy Frontend
```powershell
# Option A: GitHub Actions (automatic with Static Web App)
# Simply push to main, Azure automatically builds and deploys

# Option B: Manual build and deploy
cd e:\Github\Project_Advanced\apps\web
npm run build

# Deploy via Azure Portal or:
az staticwebapp linkedbackend link `
  -n talentmatch-web `
  -g talentmatch-rg `
  --backend-resource-id "/subscriptions/{subscriptionId}/resourceGroups/talentmatch-rg/providers/Microsoft.Web/sites/talentmatchaibackend"
```

### 5.3 Update Frontend API Configuration

Ensure `apps/web/src/services/apiClient.js` uses correct backend URL:

```javascript
const BASE_URL = process.env.VITE_API_URL || 'https://talentmatchaibackend.azurewebsites.net/api';
```

In `apps/web/.env.production`:
```
VITE_API_URL=https://talentmatchaibackend.azurewebsites.net/api
```

---

## 🧪 Phase 6: Testing & Verification

### 6.1 Health Checks
```powershell
$apiUrl = "https://talentmatchaibackend.azurewebsites.net"

# Test health endpoint
curl "$apiUrl/api/health"

# Test metrics
curl "$apiUrl/api/metrics"

# Check logs
az functionapp log tail -g talentmatch-rg -n talentmatchaibackend
```

### 6.2 End-to-End Testing

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| **Health** | `GET /api/health` | 200 OK, healthy message |
| **Metrics** | `GET /api/metrics` | 200 OK, Prometheus metrics |
| **Auth Register** | `POST /api/auth/register` | 201 Created (with email verification) |
| **Auth Login** | `POST /api/auth/login` | 200 OK, tokens in cookies |
| **Jobs List** | `GET /api/jobs` (with token) | 200 OK, jobs array |
| **Candidates** | `GET /api/candidates` | 200 OK (if authenticated) |
| **AI Matching** | `POST /api/ai/match` | Returns matched candidates |
| **CORS** | Request from frontend URL | Allowed (CORS headers present) |

### 6.3 Frontend Testing
```powershell
# Static Web App URL
$webUrl = "https://talentmatch-web.azurestaticapps.net"

# Test main page loads
curl $webUrl

# Should return HTML with React app
```

---

## 🔍 Phase 7: Monitoring & Logs

### 7.1 View Function App Logs
```powershell
# Real-time logs
az functionapp log tail `
  -g talentmatch-rg `
  -n talentmatchaibackend `
  --provider Microsoft.Web/sites

# Download logs
az functionapp log download `
  -g talentmatch-rg `
  -n talentmatchaibackend
```

### 7.2 Application Insights (Optional)
```powershell
# Enable Application Insights
az functionapp config appsettings set `
  -g talentmatch-rg `
  -n talentmatchaibackend `
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="YOUR_KEY"
```

### 7.3 Monitor Cosmos DB
```powershell
az cosmosdb show `
  -g talentmatch-rg `
  -n talentmatch-cosmos
```

---

## 🛠️ Phase 8: Troubleshooting

### Issue: Function App won't start
```powershell
# Check logs
az functionapp log tail -g talentmatch-rg -n talentmatchaibackend

# Verify environment variables
az functionapp config appsettings list `
  -g talentmatch-rg `
  -n talentmatchaibackend
```

### Issue: Cosmos DB connection fails
```powershell
# Verify connection string
$conn = $(az cosmosdb keys list `
  -g talentmatch-rg `
  -n talentmatch-cosmos `
  --type connection-strings `
  --query "connectionStrings[0].connectionString" -o tsv)

Write-Host $conn
```

### Issue: CORS errors
- Verify `CLIENT_URL` environment variable matches frontend URL
- Check static web app linked backend configuration
- Frontend must send requests to correct API URL

### Issue: Token/Authentication not working
- Verify JWT secrets are set correctly
- Check cookie settings match frontend expectations
- Review auth middleware logs

---

## 📋 Pre-Deployment Checklist

- [ ] All tests pass locally
- [ ] Environment variables configured in Function App
- [ ] GitHub secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_TALENTMATCHAI_BACKEND` created
- [ ] Cosmos DB connection string set in Function App
- [ ] Frontend API URL points to correct backend
- [ ] Static Web App linked to backend Function App
- [ ] CORS origin allows frontend URL
- [ ] Database migrations/seeding scripts ready
- [ ] Monitoring configured (Application Insights)
- [ ] Backup/disaster recovery plan documented

---

## 🚀 Quick Start (If Everything Exists)

If Azure resources already exist, deployment is simply:

```powershell
# 1. Verify environment
npm install

# 2. Build both apps
npm run build -w apps/web
cd apps/api && npm install

# 3. Deploy backend (via GitHub)
git push origin main

# 4. Verify
curl https://talentmatchaibackend.azurewebsites.net/api/health
```

---

## 📞 Support & Resources

- [Azure CLI Docs](https://learn.microsoft.com/en-us/cli/azure/)
- [Azure Functions Node.js Guide](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
- [Cosmos DB MongoDB API](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb-introduction)
- [Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)

---

## 📝 Notes

- **New Chat Feature**: Your new chat feature should:
  - Add new API routes in `apps/api/src/modules/chat/`
  - Update frontend routes in `apps/web/src/pages/`
  - Push to main branch to auto-deploy
  
- **Database**: Uses MongoDB/Cosmos DB - update models in `apps/api/src/modules/*/`

- **Security**: All endpoints require authentication except `/auth/*` and `/health`
