# TalentMatch AI

TalentMatch AI is a full-stack hiring platform with Docker-based local development, Kubernetes deployment manifests, Azure infrastructure, and monitoring through Prometheus and Grafana.

## Target DevOps Flow
1. Jenkins checks out the repository.
2. Jenkins builds Docker images for the API and web app.
3. Jenkins pushes images to Azure Container Registry.
4. Jenkins deploys to AKS with `kubectl` and `kustomize`.
5. Prometheus scrapes the API `/metrics` endpoint.
6. Grafana reads from Prometheus and shows the dashboard.

## Main Pieces
- `apps/api`: Node.js + Express API with Mongo/Cosmos support and Prometheus metrics.
- `apps/web`: React + Vite frontend.
- `k8s/base`: Kubernetes manifests for namespace, deployments, services, ingress, and HPA.
- `k8s/overlays/aks`: AKS deployment overlay used by Jenkins.
- `monitoring`: Prometheus config and Grafana provisioning/dashboard files.
- `monitoring/prometheus/rules`: Alert rules for API health and latency.
- `monitoring/alertmanager`: Local Alertmanager config for Prometheus alerts.
- `docker-compose.azure.yml`: local Azure-style container deployment.
- `docker-compose.monitoring.yml`: local app + Prometheus + Grafana stack.
- `Jenkinsfile`: CI/CD pipeline for Azure + AKS.
- `infrastructure/azure`: Bicep and Terraform for Azure resources.

## Local Monitoring Run
```bash
docker compose -f docker-compose.monitoring.yml up -d --build
```

Then open:
- API: `http://localhost:5000`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Alertmanager: `http://localhost:9093`

## Docs
Read these for the deployment plan:
1. `docs/architecture.md`
2. `docs/mvp-plan.md`
3. `docs/azure-setup.md`
4. `docs/jenkins-setup.md`
