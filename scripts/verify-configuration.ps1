# Configuration Verification Script
# This script helps verify that the debug/release mode configuration is working correctly

param(
    [switch]$Verbose,
    [string]$Repository = "anandavicky123/SyncerticaEnterprise"
)

Write-Host "🔍 Syncertica Enterprise Configuration Verification" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check environment configuration
Write-Host ""
Write-Host "📋 Environment Variables:" -ForegroundColor Yellow

$debugMode = $env:NEXT_PUBLIC_DEBUG_MODE
if ($debugMode -eq "true") {
    Write-Host "   NEXT_PUBLIC_DEBUG_MODE: $debugMode (DEBUG MODE)" -ForegroundColor Orange
} elseif ($debugMode -eq "false") {
    Write-Host "   NEXT_PUBLIC_DEBUG_MODE: $debugMode (RELEASE MODE)" -ForegroundColor Green
} else {
    Write-Host "   NEXT_PUBLIC_DEBUG_MODE: Not set (will default based on NODE_ENV)" -ForegroundColor Gray
}

$nodeEnv = $env:NODE_ENV
if ($nodeEnv) {
    Write-Host "   NODE_ENV: $nodeEnv" -ForegroundColor Gray
} else {
    Write-Host "   NODE_ENV: Not set" -ForegroundColor Gray
}

# Check GitHub CLI and secrets
Write-Host ""
Write-Host "🔐 GitHub Secrets Verification:" -ForegroundColor Yellow

if (Get-Command "gh" -ErrorAction SilentlyContinue) {
    Write-Host "   GitHub CLI: ✅ Available" -ForegroundColor Green
    
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Authentication: ✅ Authenticated" -ForegroundColor Green
        
        Write-Host "   Checking secrets..." -ForegroundColor Gray
        $secretsList = gh secret list --repo $Repository 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Repository secrets:" -ForegroundColor Gray
            
            # Check for required secrets
            $requiredSecrets = @("GHTOKEN", "AWS_AK", "AWS_SAK")
            $secretsOutput = $secretsList | Out-String
            
            foreach ($secret in $requiredSecrets) {
                if ($secretsOutput -match $secret) {
                    Write-Host "     - $secret: ✅ Found" -ForegroundColor Green
                } else {
                    Write-Host "     - $secret: ❌ Missing" -ForegroundColor Red
                }
            }
            
            if ($Verbose) {
                Write-Host ""
                Write-Host "   Full secrets list:" -ForegroundColor Gray
                $secretsList | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGray }
            }
        } else {
            Write-Host "   ❌ Cannot access repository secrets" -ForegroundColor Red
            Write-Host "     Make sure you have admin access to the repository" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Authentication: ❌ Not authenticated" -ForegroundColor Red
        Write-Host "     Run: gh auth login" -ForegroundColor Yellow
    }
} else {
    Write-Host "   GitHub CLI: ❌ Not installed" -ForegroundColor Red
    Write-Host "     Install from: https://cli.github.com/" -ForegroundColor Yellow
}

# Check file structure
Write-Host ""
Write-Host "📁 Configuration Files:" -ForegroundColor Yellow

$configFiles = @(
    "app\shared\config\environment.ts",
    ".env.example",
    "GITHUB_SECRETS_SETUP.md",
    "scripts\setup-github-secrets-updated.ps1"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   $file: ✅ Found" -ForegroundColor Green
    } else {
        Write-Host "   $file: ❌ Missing" -ForegroundColor Red
    }
}

# Mode detection simulation
Write-Host ""
Write-Host "🎯 Mode Detection Simulation:" -ForegroundColor Yellow

Write-Host "   Current mode would be:" -ForegroundColor Gray
if ($debugMode -eq "true") {
    Write-Host "     DEBUG MODE (explicit tokens/keys)" -ForegroundColor Orange
} elseif ($debugMode -eq "false") {
    Write-Host "     RELEASE MODE (GitHub secrets)" -ForegroundColor Green
} elseif ($nodeEnv -eq "development") {
    Write-Host "     DEBUG MODE (development environment)" -ForegroundColor Orange
} else {
    Write-Host "     RELEASE MODE (production environment)" -ForegroundColor Green
}

# Recommendations
Write-Host ""
Write-Host "💡 Recommendations:" -ForegroundColor Yellow

if ($debugMode -ne "false" -and $nodeEnv -eq "production") {
    Write-Host "   ⚠️  Consider setting NEXT_PUBLIC_DEBUG_MODE=false for production" -ForegroundColor Orange
}

if ($debugMode -eq "true") {
    Write-Host "   🔧 Debug mode is active - tokens/keys are hardcoded in environment.ts" -ForegroundColor Orange
    Write-Host "   📍 To switch to release mode: set NEXT_PUBLIC_DEBUG_MODE=false" -ForegroundColor Gray
} else {
    Write-Host "   🛡️  Release mode is active - using GitHub secrets" -ForegroundColor Green
    Write-Host "   📍 To switch to debug mode: set NEXT_PUBLIC_DEBUG_MODE=true" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Green
Write-Host "   1. Run your application and check the Projects component" -ForegroundColor Gray
Write-Host "   2. Click the info button next to the mode indicator" -ForegroundColor Gray
Write-Host "   3. Verify the configuration shows correct token sources" -ForegroundColor Gray
Write-Host "   4. Check browser console for debug messages (if in debug mode)" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Configuration verification complete!" -ForegroundColor Green
