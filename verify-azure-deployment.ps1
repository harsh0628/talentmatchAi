#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Verify existing TalentMatch AI Azure deployment
.DESCRIPTION
    Checks all Azure resources and provides deployment status
.EXAMPLE
    .\verify-azure-deployment.ps1
#>

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Cyan
}

function Test-AzureCLI {
    try {
        az --version | Out-Null
        Write-Host "✅ Azure CLI installed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Azure CLI not found. Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows" -ForegroundColor Red
        return $false
    }
}

function Test-AzureLogin {
    try {
        $account = az account show --query name -o tsv 2>$null
        if ($account) {
            Write-Host "✅ Logged in to Azure: $account" -ForegroundColor Green
            return $true
        }
        Write-Host "❌ Not logged in to Azure" -ForegroundColor Red
        Write-Host "Run: az login" -ForegroundColor Yellow
        return $false
    }
    catch {
        return $false
    }
}

function Get-ResourceGroupStatus {
    param([string]$ResourceGroup = "talentmatch-rg")
    
    try {
        $rg = az group show -n $ResourceGroup --query "{name: name, location: location}" 2>$null | ConvertFrom-Json
        if ($rg) {
            Write-Host "✅ Resource Group Exists" -ForegroundColor Green
            Write-Host "   Name: $($rg.name)" -ForegroundColor White
            Write-Host "   Location: $($rg.location)" -ForegroundColor White
            return $true
        }
        else {
            Write-Host "❌ Resource Group NOT found: $ResourceGroup" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking Resource Group: $_" -ForegroundColor Red
        return $false
    }
}

function Get-FunctionAppStatus {
    param(
        [string]$ResourceGroup = "talentmatch-rg",
        [string]$FunctionAppName = "talentmatchaibackend"
    )
    
    try {
        $app = az functionapp show -g $ResourceGroup -n $FunctionAppName --query "{name: name, state: state, url: defaultHostName}" 2>$null | ConvertFrom-Json
        if ($app) {
            Write-Host "✅ Function App Exists" -ForegroundColor Green
            Write-Host "   Name: $($app.name)" -ForegroundColor White
            Write-Host "   State: $($app.state)" -ForegroundColor White
            Write-Host "   URL: https://$($app.url)" -ForegroundColor White
            
            # Test health endpoint
            try {
                $health = Invoke-WebRequest -Uri "https://$($app.url)/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($health.StatusCode -eq 200) {
                    Write-Host "   ✅ Health endpoint responds" -ForegroundColor Green
                }
                else {
                    Write-Host "   ⚠️ Health endpoint returned: $($health.StatusCode)" -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host "   ⚠️ Could not test health endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            return $true
        }
        else {
            Write-Host "❌ Function App NOT found: $FunctionAppName" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking Function App: $_" -ForegroundColor Red
        return $false
    }
}

function Get-StaticWebAppStatus {
    param(
        [string]$ResourceGroup = "talentmatch-rg",
        [string]$WebAppName = "talentmatch-web"
    )
    
    try {
        $app = az staticwebapp show -g $ResourceGroup -n $WebAppName --query "{name: name, defaultDomain: defaultDomain}" 2>$null | ConvertFrom-Json
        if ($app) {
            Write-Host "✅ Static Web App Exists" -ForegroundColor Green
            Write-Host "   Name: $($app.name)" -ForegroundColor White
            Write-Host "   URL: https://$($app.defaultDomain)" -ForegroundColor White
            
            # Test web endpoint
            try {
                $web = Invoke-WebRequest -Uri "https://$($app.defaultDomain)" -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($web.StatusCode -eq 200) {
                    Write-Host "   ✅ Web app is accessible" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "   ⚠️ Could not access web app: $($_.Exception.Message)" -ForegroundColor Yellow
            }
            return $true
        }
        else {
            Write-Host "❌ Static Web App NOT found: $WebAppName" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking Static Web App: $_" -ForegroundColor Red
        return $false
    }
}

function Get-CosmosDBStatus {
    param(
        [string]$ResourceGroup = "talentmatch-rg",
        [string]$AccountName = "talentmatch-cosmos"
    )
    
    try {
        $cosmos = az cosmosdb show -g $ResourceGroup -n $AccountName --query "{name: name, locations: locations[0].locationName, kind: kind}" 2>$null | ConvertFrom-Json
        if ($cosmos) {
            Write-Host "✅ Cosmos DB Exists" -ForegroundColor Green
            Write-Host "   Name: $($cosmos.name)" -ForegroundColor White
            Write-Host "   Kind: $($cosmos.kind)" -ForegroundColor White
            Write-Host "   Region: $($cosmos.locations)" -ForegroundColor White
            return $true
        }
        else {
            Write-Host "❌ Cosmos DB NOT found: $AccountName" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking Cosmos DB: $_" -ForegroundColor Red
        return $false
    }
}

function Get-EnvironmentVariables {
    param(
        [string]$ResourceGroup = "talentmatch-rg",
        [string]$FunctionAppName = "talentmatchaibackend"
    )
    
    try {
        $settings = az functionapp config appsettings list -g $ResourceGroup -n $FunctionAppName 2>$null | ConvertFrom-Json
        if ($settings) {
            Write-Host "✅ Configuration Retrieved" -ForegroundColor Green
            Write-Host "   Total Settings: $($settings.Count)" -ForegroundColor White
            
            $requiredSettings = @(
                "MONGODB_URI",
                "CLIENT_URL",
                "NODE_ENV",
                "JWT_ACCESS_SECRET",
                "JWT_REFRESH_SECRET",
                "GEMINI_API_KEY"
            )
            
            Write-Host ""
            Write-Host "   Critical Settings:" -ForegroundColor Cyan
            foreach ($setting in $requiredSettings) {
                $value = $settings | Where-Object { $_.name -eq $setting } | Select-Object -ExpandProperty value
                if ($value) {
                    if ($setting -like "*SECRET*" -or $setting -like "*KEY*" -or $setting -like "*PASSWORD*") {
                        Write-Host "   ✅ $setting = [SET]" -ForegroundColor Green
                    }
                    else {
                        Write-Host "   ✅ $setting = $value" -ForegroundColor Green
                    }
                }
                else {
                    Write-Host "   ❌ $setting = [NOT SET]" -ForegroundColor Red
                }
            }
            return $true
        }
        return $false
    }
    catch {
        Write-Host "❌ Error retrieving settings: $_" -ForegroundColor Red
        return $false
    }
}

function Get-DeploymentLogs {
    param(
        [string]$ResourceGroup = "talentmatch-rg",
        [string]$FunctionAppName = "talentmatchaibackend",
        [int]$Lines = 20
    )
    
    try {
        Write-Host "Recent Logs (last $Lines lines):" -ForegroundColor Cyan
        $logs = az functionapp log tail -g $ResourceGroup -n $FunctionAppName --provider Microsoft.Web/sites --max-lines $Lines 2>&1 | tail -n $Lines
        Write-Host $logs -ForegroundColor White
    }
    catch {
        Write-Host "⚠️ Could not retrieve logs: $_" -ForegroundColor Yellow
    }
}

# Main execution
Clear-Host
Write-Section "TalentMatch AI - Azure Deployment Verification"

# Check prerequisites
Write-Host ""
Write-Host "Checking Prerequisites..." -ForegroundColor Cyan
if (-not (Test-AzureCLI)) { exit 1 }
if (-not (Test-AzureLogin)) { exit 1 }

# Check resources
Write-Section "Resource Status"
$rgExists = Get-ResourceGroupStatus
if ($rgExists) {
    Write-Section "Azure Resources"
    Get-FunctionAppStatus
    Write-Host ""
    Get-StaticWebAppStatus
    Write-Host ""
    Get-CosmosDBStatus
    
    Write-Section "Configuration"
    Get-EnvironmentVariables
    
    Write-Section "Recent Deployment Logs"
    Get-DeploymentLogs
}

Write-Section "Summary"
Write-Host ""
Write-Host "To deploy updates:" -ForegroundColor Cyan
Write-Host "  1. Push changes to main branch: git push origin main" -ForegroundColor White
Write-Host "  2. GitHub Actions will automatically build and deploy" -ForegroundColor White
Write-Host "  3. Monitor deployment at: GitHub > Actions" -ForegroundColor White
Write-Host ""
Write-Host "To test endpoints:" -ForegroundColor Cyan
Write-Host "  curl https://talentmatchaibackend.azurewebsites.net/api/health" -ForegroundColor White
Write-Host ""
