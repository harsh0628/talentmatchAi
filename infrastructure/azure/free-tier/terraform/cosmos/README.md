# Terraform - Cosmos DB (Free Tier)

This module deploys a free-tier Cosmos DB account using the Mongo API.

## Steps

1. Go to this folder:

```bash
cd infrastructure/azure/free-tier/terraform/cosmos
```

2. Create your tfvars file:

```bash
copy terraform.tfvars.example terraform.tfvars
```

3. Edit `terraform.tfvars` if you want different names or region.

4. Login to Azure:

```bash
az login
```

5. Initialize Terraform:

```bash
terraform init
```

6. Plan:

```bash
terraform plan -var-file=terraform.tfvars
```

7. Apply:

```bash
terraform apply -var-file=terraform.tfvars
```

## Get connection string

```bash
az cosmosdb keys list -g <resource-group> -n <cosmos-account> --type connection-strings -o tsv
```

## Notes

- Free tier is allowed once per subscription. If already used, Azure may bill the account.
- Cosmos account names must be globally unique and lowercase.
