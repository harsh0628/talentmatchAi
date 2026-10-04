# TalentMatch AI Deployment Notes

This document is the running demo and deployment log for the project.

## Completed steps

1. Created TalentMatch AI with a React/Vite frontend, Node.js/Express backend, MongoDB persistence, and LLM/RAG functionality.
2. Synchronized the project with GitHub.
3. Created an Azure Kubernetes Service (AKS) cluster.
4. Created an Azure Container Registry (ACR).
5. Connected AKS to ACR by assigning the `AcrPull` role to the AKS kubelet identity.
6. Replaced JWT access/refresh tokens with an HTTP-only server-side session cookie.
7. Verified the local frontend, backend, MongoDB connection, health endpoints, authentication validation, and protected API responses.
8. Added Dockerfiles and Docker Compose for a repeatable local/demo deployment.

## Current container setup

- `mongodb`: MongoDB 7 with persistent Docker volume storage.
- `api`: Node.js API on port `5000`.
- `web`: Production Vite build served by Nginx on port `5173`.

## Next deployment steps

1. Run and verify the complete application locally with Docker Compose.
2. Build and push the API and frontend images to ACR.
3. Create Kubernetes Deployments and Services for the API and frontend.
4. Add MongoDB production configuration. For a demo, use Azure Cosmos DB for MongoDB or MongoDB Atlas instead of running MongoDB inside AKS.
5. Expose the frontend publicly and configure the API `CLIENT_URL` to that frontend URL.
6. Record the public URLs and final demo verification results here.

## Current status

- Docker Compose configuration validation passed.
- The local container stack could not be started because the Docker Desktop Linux engine is not running. Start Docker Desktop, then rerun `docker compose up --build -d`.
- The frontend now proxies `/api` to the API Service. This keeps the session cookie same-origin when the demo uses HTTP LoadBalancer addresses.
- For HTTPS, set `SESSION_COOKIE_SECURE=true`; for the current HTTP demo, set it to `false`.
- The API Service uses internal port `5000`; the frontend Nginx proxy and AKS manifest now use the same port.
- Recreated the production-ready AKS files at `k8s/api.yaml` and `k8s/web.yaml`; the API is internal (`ClusterIP`) and only the frontend is public.
- Added GitHub Actions workflow `.github/workflows/deploy-aks.yml` to build commit-tagged images in ACR and roll them out to AKS after every push to `main`.

## Production authentication issue

The live browser showed a successful login (`200`) followed by `401 Login is required` for jobs, candidates, interviews, and evaluation reports. This means the API is reachable, but the session cookie is not included in subsequent requests. Before changing application code, verify that the live frontend is the new image with `/api` same-origin routing and that the API is the `v2` image with `SESSION_COOKIE_SECURE=false` for an HTTP IP demo.

Use a new image tag for every fix, set `imagePullPolicy: Always` during the demo, and verify the browser login response contains `Set-Cookie: tm_session`. The production deployment should eventually use one HTTPS hostname with an Ingress; then set `SESSION_COOKIE_SECURE=true`.

### Confirmed live-cluster finding

The live AKS deployments were still using `talentmatch-api:v1` and `talentmatch-web:v1`. These images predate the same-origin `/api` proxy and configurable HTTP session cookie fix. The next action is to build and deploy `v2`.

## GitHub Actions deployment

Configure these GitHub repository secrets before pushing to `main`:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

The Azure service principal must have `Contributor` access to the AKS resource group and `AcrPush` access to the registry. The AKS kubelet identity already has `AcrPull`. The workflow tags each image with the Git commit SHA, updates the API and frontend Deployments, ensures the API Service is internal, and waits for both rollouts.

This AKS cluster does not have managed Entra ID/Azure RBAC enabled (`aadProfile.enableAzureRbac` returned blank). The workflow therefore uses `az aks get-credentials --admin`. This is suitable for the current demo because the GitHub identity has `Contributor` on the AKS resource group. For a hardened production setup, enable managed Entra ID and Azure RBAC deliberately, then replace the admin kubeconfig with namespace-scoped deployment permissions.

### OIDC login failure and fix

The first GitHub Actions run reached Azure OIDC successfully but failed with `AADSTS70025`, because the `talentmatch-github-actions` app had no federated identity credential. The credential must match `repo:harsh0628/talentmatchAi:ref:refs/heads/main`, issuer `https://token.actions.githubusercontent.com`, and audience `api://AzureADTokenExchange`.

### Efficient GitHub Actions setup checklist

1. Keep only `.github/workflows/deploy-aks.yml`; remove obsolete Static Web Apps and Function App workflows.
2. Create or select one Azure Entra application/service principal for GitHub Actions.
3. Add a federated credential for the GitHub repository and the `main` branch. Do not use a client secret in GitHub.
4. Grant the identity `Contributor` on `myAKSResourceGroup` and `AcrPush` on `talentmatchacr2026`.
5. Add these GitHub repository secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`.
6. Push to `main`, then monitor the `Build and deploy TalentMatch AI to AKS` workflow.
7. Verify the commit-SHA image tags, rollout status, services, and the live frontend after the workflow succeeds.

## Azure external IP sequence

The `CLIENT_URL` value must be the public IP of the frontend Service, not the API Service. Azure assigns both addresses after the Kubernetes `LoadBalancer` Services are applied:

```bash
kubectl get service talentmatch-api
kubectl get service talentmatch-web
```

Use the API external IP to test `/health` and to build the frontend's `VITE_API_URL`. Use the frontend external IP for the API `CLIENT_URL` value, then restart the API deployment.
