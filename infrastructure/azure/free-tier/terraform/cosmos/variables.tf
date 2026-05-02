variable "resource_group_name" {
  type        = string
  description = "Resource group name."
}

variable "location" {
  type        = string
  description = "Azure region for the resource group."
}

variable "cosmos_account_name" {
  type        = string
  description = "Globally unique Cosmos DB account name (lowercase, 3-44 chars)."
}

variable "mongo_database_name" {
  type        = string
  description = "Mongo database name."
  default     = "talentmatch"
}
