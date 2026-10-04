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

## Production authentication issue

The live browser showed a successful login (`200`) followed by `401 Login is required` for jobs, candidates, interviews, and evaluation reports. This means the API is reachable, but the session cookie is not included in subsequent requests. Before changing application code, verify that the live frontend is the new image with `/api` same-origin routing and that the API is the `v2` image with `SESSION_COOKIE_SECURE=false` for an HTTP IP demo.

Use a new image tag for every fix, set `imagePullPolicy: Always` during the demo, and verify the browser login response contains `Set-Cookie: tm_session`. The production deployment should eventually use one HTTPS hostname with an Ingress; then set `SESSION_COOKIE_SECURE=true`.

## Azure external IP sequence

The `CLIENT_URL` value must be the public IP of the frontend Service, not the API Service. Azure assigns both addresses after the Kubernetes `LoadBalancer` Services are applied:

```bash
kubectl get service talentmatch-api
kubectl get service talentmatch-web
```

Use the API external IP to test `/health` and to build the frontend's `VITE_API_URL`. Use the frontend external IP for the API `CLIENT_URL` value, then restart the API deployment.
