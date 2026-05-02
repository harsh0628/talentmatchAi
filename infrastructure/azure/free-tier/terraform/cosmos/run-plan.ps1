#!/usr/bin/env pwsh

# Set up aliases and environment
$env:Path = "$env:LOCALAPPDATA\terraform;" + "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path

Set-Alias -Name terraform -Value "$env:LOCALAPPDATA\terraform\terraform.exe" -Scope Global
Set-Alias -Name az -Value "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd" -Scope Global

# Navigate to cosmos folder
cd "e:\Github\Project_Advanced\infrastructure\azure\free-tier\terraform\cosmos"

# Run plan
Write-Host "Running: terraform plan"
terraform plan
