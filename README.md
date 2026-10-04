# TalentMatch AI

TalentMatch AI is a full-stack, AI-powered hiring workspace for recruiters and interviewers. It combines a React frontend, Node.js API, MongoDB persistence, and LLM/RAG-assisted candidate matching and evaluation workflows.

The project also includes a containerized Azure deployment path:

```text
GitHub
  -> GitHub Actions
  -> Azure Container Registry
  -> Azure Kubernetes Service
  -> Live TalentMatch AI application
```

## Highlights

- Recruiter workspace for managing jobs and candidates.
- AI match scoring between job requirements and candidate profiles.
- Skill-gap analysis.
- LLM/RAG context using existing jobs and candidates.
- Interview scheduling and evaluation workflows.
- Benchmarking and evaluation reports.
- Role-based access for Admin, Recruiter, and Interviewer users.
- Password hashing with bcrypt.
- HTTP-only server-side sessions without JWT access or refresh tokens.
- Prometheus-compatible metrics endpoint.
- Request logging, security headers, CORS, and rate limiting.
- Production frontend build served by Nginx.
- Docker Compose support for local container testing.
- Automated ACR image builds and AKS deployments through GitHub Actions.

## Technology stack

### Frontend

- React 18
- Vite
- React Router
- Nginx for production static file serving and API reverse proxying

### Backend

- Node.js 20+
- Express
- Mongoose
- bcryptjs
- HTTP-only MongoDB-backed sessions
- Prometheus metrics with `prom-client`
- Helmet, CORS, Morgan, and Express rate limiting

### Infrastructure

- GitHub
- GitHub Actions
- Azure Container Registry
- Azure Kubernetes Service
- MongoDB Atlas or Azure Cosmos DB for MongoDB

## Repository structure

```text
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── web/
│       ├── src/
│       ├── Dockerfile
│       └── nginx.conf
├── k8s/
│   ├── api.yaml
│   └── web.yaml
├── .github/
│   └── workflows/
│       └── deploy-aks.yml
├── docker-compose.yml
├── DEPLOYMENT-NOTES.md
├── package.json
└── package-lock.json
```

## Prerequisites

Install the following tools for local development:

- Node.js 20 or later
- npm
- Git
- MongoDB, MongoDB Atlas, or Docker Desktop

For Azure deployment, also install:

- Azure CLI
- kubectl
- An Azure subscription
- An Azure Container Registry
- An AKS cluster

## Local development

Clone the repository and install dependencies:

```bash
git clone https://github.com/harsh0628/talentmatchAi.git
cd talentmatchAi
npm install
```

Create the API environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

On Windows PowerShell:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Update `apps/api/.env` with a MongoDB connection string and development configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/talentmatch
CLIENT_URL=http://localhost:5173
NODE_ENV=development
SESSION_COOKIE_NAME=tm_session
SESSION_MAX_AGE_MS=604800000
SESSION_COOKIE_SECURE=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AI_ENABLE_HEURISTIC_FALLBACK=true
```

Start the frontend and backend:

```bash
npm run dev
```

Open:

- Frontend: <http://localhost:5173>
- API: <http://localhost:5000>
- API health: <http://localhost:5000/health>
- API metrics: <http://localhost:5000/metrics>

If the root development command is unavailable, run the applications separately:

```bash
npm run dev:api
npm run dev:web
```

## Docker Compose

Docker Compose runs MongoDB, the API, and the production frontend together:

```bash
docker compose up --build -d
```

Open the application at:

<http://localhost:5173>

Verify the API:

```bash
curl http://localhost:5000/health
```

View service status and logs:

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
```

Stop the services:

```bash
docker compose down
```

Remove the MongoDB demo volume as well:

```bash
docker compose down -v
```

The frontend uses `/api` and Nginx proxies requests to the API container. This keeps authentication cookies on the same browser origin.

## Authentication

The application uses a simple server-side session model:

1. The user logs in with email and password.
2. The API creates a random session identifier.
3. A hash of the identifier is stored in MongoDB.
4. The raw identifier is sent as an HTTP-only cookie.
5. Protected API requests are authorized using that cookie.
6. Logout removes the session from MongoDB and clears the cookie.

JWT access tokens and refresh tokens are not used.

For an HTTP IP-based demo, use:

```env
SESSION_COOKIE_SECURE=false
```

For HTTPS production hosting, use:

```env
SESSION_COOKIE_SECURE=true
```

## API overview

Public endpoints:

```text
GET  /
GET  /health
GET  /api/health
GET  /metrics
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/check-email
```

Authenticated endpoints include:

```text
GET/POST/PATCH/DELETE  /api/jobs
GET/POST/PATCH/DELETE  /api/candidates
GET/POST/PATCH/DELETE  /api/interviews
GET/POST/PATCH/DELETE  /api/evaluation-reports
POST                   /api/ai/match-score
POST                   /api/ai/match-score-hybrid
POST                   /api/ai/match-score-workflow
POST                   /api/ai/skill-gap-analysis
GET/POST               /api/benchmarks
GET                    /api/auth/me
POST                   /api/auth/logout
```

Unauthenticated requests to protected endpoints should return:

```json
{
  "success": false,
  "message": "Login is required"
}
```

## Production build

Build the frontend:

```bash
npm run build --workspace @talentmatch/web
```

Validate the API package:

```bash
npm run build --workspace @talentmatch/api
```

The frontend output is generated in `apps/web/dist`.

## Azure architecture

The production demo uses the following Azure resources:

- Azure Container Registry: `talentmatchacr2026`
- AKS cluster: `aks-web-demo`
- AKS resource group: `myAKSResourceGroup`
- ACR resource group: `ai-talentmatch`

The AKS kubelet identity has `AcrPull`, allowing cluster nodes to pull private images from ACR.

The API is exposed internally as a Kubernetes `ClusterIP` Service. The frontend is exposed publicly using a `LoadBalancer` Service. Nginx forwards frontend requests under `/api` to the internal API Service:

```text
Browser -> Frontend LoadBalancer -> Nginx /api proxy -> API ClusterIP -> MongoDB
```

This same-origin routing is important because it allows the session cookie to be sent consistently between the frontend and API.

## Manual AKS deployment

Connect to the cluster:

```bash
az aks get-credentials \
  --resource-group myAKSResourceGroup \
  --name aks-web-demo \
  --overwrite-existing
```

Verify the nodes:

```bash
kubectl get nodes
```

Build the API image in ACR:

```bash
az acr build \
  --registry talentmatchacr2026 \
  --resource-group ai-talentmatch \
  --image talentmatch-api:v2 \
  --file apps/api/Dockerfile \
  apps/api
```

Build the frontend image with same-origin API routing:

```bash
az acr build \
  --registry talentmatchacr2026 \
  --resource-group ai-talentmatch \
  --image talentmatch-web:v2 \
  --file apps/web/Dockerfile \
  --build-arg VITE_API_URL=/api \
  apps/web
```

Before applying `k8s/api.yaml`, replace the MongoDB placeholder with a real connection string. Never commit database credentials to GitHub.

Apply the manifests:

```bash
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/web.yaml
```

Wait for the deployments:

```bash
kubectl rollout status deployment/talentmatch-api
kubectl rollout status deployment/talentmatch-web
```

Get the frontend public address:

```bash
kubectl get service talentmatch-web
```

Then configure the API CORS origin:

```bash
FRONTEND_EXTERNAL_IP=$(kubectl get service talentmatch-web \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

kubectl set env deployment/talentmatch-api \
  CLIENT_URL="http://$FRONTEND_EXTERNAL_IP" \
  SESSION_COOKIE_SECURE=false
```

Open:

```text
http://<FRONTEND_EXTERNAL_IP>
```

## Automated deployment with GitHub Actions

The workflow at `.github/workflows/deploy-aks.yml` runs on every push to `main`.

It:

1. Authenticates to Azure using GitHub OIDC.
2. Builds the API image in ACR.
3. Builds the frontend image in ACR with `VITE_API_URL=/api`.
4. Tags each image with the Git commit SHA.
5. Gets AKS credentials.
6. Ensures the API Service is internal on port `5000`.
7. Updates the API and frontend Deployments.
8. Waits for both rollouts to complete.

Configure these GitHub repository secrets:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

The Azure identity used by GitHub Actions requires:

- `AcrPush` on `talentmatchacr2026`
- Registry-scoped `Contributor` for `az acr build`
- `Contributor` on `myAKSResourceGroup`

The GitHub OIDC federated credential must match:

```text
Issuer:   https://token.actions.githubusercontent.com
Subject:  repo:harsh0628/talentmatchAi:ref:refs/heads/main
Audience: api://AzureADTokenExchange
```

Deploy a change:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

Monitor the workflow under the repository's **Actions** tab.

Verify the deployed commit tag:

```bash
kubectl get deployment talentmatch-api \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'

kubectl get deployment talentmatch-web \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

## Troubleshooting

### Protected API endpoints return `401 Login is required`

Check that:

1. The frontend uses `/api`, not a separate API external IP.
2. The frontend image contains the Nginx proxy.
3. The API has `SESSION_COOKIE_SECURE=false` when using an HTTP IP.
4. The login response includes `Set-Cookie: tm_session`.
5. Later requests include `Cookie: tm_session`.
6. The API Service is `ClusterIP` on port `5000`.

Useful commands:

```bash
kubectl get services
kubectl get pods
kubectl logs deployment/talentmatch-api --tail=100
kubectl describe deployment talentmatch-web
```

### GitHub Actions cannot authenticate to Azure

Check the OIDC federated credential and confirm the subject matches the `main` branch exactly.

### ACR cannot be found

Confirm the registry subscription and resource group:

```bash
az acr show \
  --name talentmatchacr2026 \
  --resource-group ai-talentmatch \
  --output table
```

The workflow must use `--resource-group ai-talentmatch` for both ACR builds.

### Roll back a deployment

```bash
kubectl rollout undo deployment/talentmatch-api
kubectl rollout undo deployment/talentmatch-web
```

## Demo presentation flow

For a live senior/demo presentation:

1. Introduce TalentMatch AI and the hiring problem it addresses.
2. Explain the React, Node.js, MongoDB, and LLM/RAG architecture.
3. Show the GitHub repository and project structure.
4. Show the AKS cluster and ACR resources in Azure.
5. Demonstrate a GitHub Actions deployment from a code change.
6. Open the live frontend URL.
7. Register or log in.
8. Create or review a job.
9. Add a candidate.
10. Run AI match scoring with RAG context.
11. Demonstrate skill-gap analysis.
12. Show interview and evaluation workflows.
13. Show benchmark results and API health.
14. Explain that the deployed image is tagged with the Git commit SHA.

## Security notes

- Never commit `.env`, database credentials, Gemini keys, or Kubernetes Secret values.
- Use GitHub OIDC instead of long-lived Azure client secrets.
- Use HTTPS and `SESSION_COOKIE_SECURE=true` for real production hosting.
- Prefer MongoDB Atlas or Azure Cosmos DB for MongoDB instead of a single MongoDB pod in AKS.
- Replace broad demo permissions with least-privilege Azure and Kubernetes roles before production use.
- Rotate any credential that has been exposed in logs, screenshots, commits, or chat.

## Deployment documentation

The chronological deployment log is maintained in [DEPLOYMENT-NOTES.md](./DEPLOYMENT-NOTES.md).
