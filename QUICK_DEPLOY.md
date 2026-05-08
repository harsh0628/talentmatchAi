# 🚀 TalentMatch AI - QUICK DEPLOY GUIDE

**Your Azure Setup:** Function App (`talentmatchaibackend5314`) + Cosmos DB (`talentmatchai-cosmos4274`)  
**Status:** Ready for deployment with minor configuration  
**Time to Deploy:** ~15 minutes

---

## ⚡ Fast Track Deployment (3 Steps)

### Step 1: Configure Function App Environment (5 minutes)

**Open Azure Portal:**
1. Go to: https://portal.azure.com
2. Search for: `talentmatchaibackend5314`
3. Click on the Function App
4. In left menu: **Configuration** → **Application Settings**
5. Click **+  New Application Setting** and add each:

| Setting Name | Value |
|--------------|-------|
| `CLIENT_URL` | `http://localhost:5173` |
| `NODE_ENV` | `production` |
| `JWT_ACCESS_SECRET` | `talentmatch-ai-access-secret-2026-prod` |
| `JWT_REFRESH_SECRET` | `talentmatch-ai-refresh-secret-2026-prod` |
| `JWT_ACCESS_EXPIRES_IN` | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_COOKIE_NAME` | `tm_refresh_token` |
| `JWT_REFRESH_COOKIE_MAX_AGE_MS` | `604800000` |
| `AUTH_MAX_FAILED_LOGIN_ATTEMPTS` | `5` |
| `AUTH_LOCKOUT_MINUTES` | `30` |
| `GEMINI_API_KEY` | `YOUR_GEMINI_KEY` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `AI_REQUEST_TIMEOUT_MS` | `20000` |
| `AI_ENABLE_HEURISTIC_FALLBACK` | `true` |

6. Click **Save** at the top
7. When prompted, click **Continue**

### Step 2: Deploy Backend Code (5 minutes)

**Option A - Git Push (Automatic):**
```bash
cd e:\Github\Project_Advanced
git add .
git commit -m "Deploy to Azure - configured production settings"
git push origin main
```

This automatically triggers GitHub Actions which:
1. ✅ Builds the API
2. ✅ Packages it
3. ✅ Deploys to Azure Functions
4. ⏱️ Takes 5-10 minutes

**Option B - Manual Azure CLI (if Option A doesn't work):**
```bash
cd e:\Github\Project_Advanced\apps\api
func azure functionapp publish talentmatchaibackend5314
```

### Step 3: Verify Deployment (2 minutes)

**Test API is working:**
```bash
# In PowerShell:
Invoke-WebRequest -Uri "https://talentmatchaibackend5314.azurewebsites.net/api/health"
```

**Expected result:**
```json
{
  "success": true,
  "message": "API is healthy"
}
```

---

## ✅ Deployment Verification Checklist

After deployment, verify each:

- [ ] Health endpoint returns 200 OK
- [ ] Metrics endpoint works: `/api/metrics`
- [ ] Can reach database (no connection errors in logs)
- [ ] Authentication endpoints working
- [ ] Chat feature endpoints available

---

## 🧪 Test Each Endpoint

```powershell
# Set variables
$API = "https://talentmatchaibackend5314.azurewebsites.net"

# Test 1: Health Check
Invoke-WebRequest "$API/api/health"

# Test 2: Metrics (Prometheus)
Invoke-WebRequest "$API/api/metrics"

# Test 3: Register User
$body = @{email="test@test.com"; password="TestPass123!"; role="Admin"} | ConvertTo-Json
Invoke-WebRequest -Uri "$API/api/auth/register" -Method POST -Body $body -ContentType "application/json"

# Test 4: Login
$loginBody = @{email="test@test.com"; password="TestPass123!"} | ConvertTo-Json
Invoke-WebRequest -Uri "$API/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ResponseHeadersVariable rh
Write-Host $rh
```

---

## 📱 Deploy Frontend (Optional Now, Do Later)

Once backend is working:

```powershell
# Create Static Web App for React frontend
az staticwebapp create `
  -g TalentMatchAI_group `
  -n talentmatch-web `
  -s https://github.com/YOUR_USERNAME/Project_Advanced `
  --branch main `
  --login-with-github
```

---

## 🔧 Useful Commands

### Restart Function App
```bash
az functionapp stop -g TalentMatchAI_group -n talentmatchaibackend5314
az functionapp start -g TalentMatchAI_group -n talentmatchaibackend5314
```

### View Logs (if available)
```bash
az functionapp log show -g TalentMatchAI_group -n talentmatchaibackend5314
```

### Update Single Setting
```bash
az functionapp config appsettings set `
  -g TalentMatchAI_group `
  -n talentmatchaibackend5314 `
  --settings JWT_ACCESS_SECRET="new-value"
```

### Get Connection String
```bash
az cosmosdb keys list `
  -g TalentMatchAI_group `
  -n talentmatch-cosmos4274 `
  --type connection-strings `
  --query "connectionStrings[0].connectionString"
```

---

## 🆘 Troubleshooting

### API Returns 503
**Solution:**
1. Restart Function App
2. Check all environment variables are set
3. Verify database connection
4. Check Application Insights for errors

### GitHub Actions Fails
**Solution:**
1. Check `.github/workflows/main_talentmatchaibackend.yml` is correct
2. Verify `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_TALENTMATCHAI_BACKEND` secret exists
3. Run: `git push origin main` to retry

### Database Connection Error
**Solution:**
1. Verify `MONGODB_URI` is set correctly
2. Check Cosmos DB connection string hasn't changed
3. Verify firewall rules (if any)

### JWT Token Issues
**Solution:**
1. Make sure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
2. Check they're long enough (min 32 characters recommended)
3. Restart Function App after changing

---

## 📊 Your Current Setup

```
Subscription: Azure for Students
Resource Group: TalentMatchAI_group
Region: Central India

🔧 Services:
├─ Function App: talentmatchaibackend5314 ✅
├─ Cosmos DB: talentmatch-cosmos4274 ✅
├─ Storage: talentmatchaistorage5314 ✅
├─ App Plan: CentralIndiaPlan ✅
└─ Application Insights: Connected ✅

📦 Project Code:
├─ Backend: e:\Github\Project_Advanced\apps\api
├─ Frontend: e:\Github\Project_Advanced\apps\web
└─ Workflow: .github\workflows\main_talentmatchaibackend.yml
```

---

## 🎯 Next: Add New Chat Feature

Once deployed, your new chat feature will:

1. **Create API module** in `apps/api/src/modules/chat/`
2. **Add routes** to backend
3. **Create chat page** in `apps/web/src/pages/`
4. **Push to main** - auto-deploys!

---

## 💡 Pro Tips

1. **Always test locally first:**
   ```bash
   npm run dev:api
   npm run dev:web
   ```

2. **Use Postman** to test API endpoints before deploying

3. **Monitor Application Insights** in Azure Portal for issues

4. **Keep secrets safe** - never commit to GitHub

5. **Use Azure Key Vault** for production secrets (future)

---

**Need Help?**
- Check AZURE_STATUS_REPORT.md for detailed information
- See AZURE_DEPLOYMENT_GUIDE.md for complete instructions
- View your logs in Azure Portal → Function App → Log Stream

**Ready to Deploy?** Follow the 3 steps above! 🚀
