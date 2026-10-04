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
