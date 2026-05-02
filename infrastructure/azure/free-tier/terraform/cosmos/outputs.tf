output "cosmos_account_name" {
  value       = azurerm_cosmosdb_account.cosmos.name
  description = "Cosmos DB account name."
}

output "cosmos_endpoint" {
  value       = azurerm_cosmosdb_account.cosmos.endpoint
  description = "Cosmos DB endpoint."
}

output "cosmos_connection_string" {
  value       = azurerm_cosmosdb_account.cosmos.primary_mongodb_connection_string
  description = "MongoDB connection string for the Cosmos DB account."
  sensitive   = true
}
