# GitHub Repository Secrets Configuration Script (PowerShell)
# This script helps configure the required secrets for GitHub Actions CI/CD pipeline

Write-Host "GitHub Repository Secrets Configuration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if GitHub CLI is installed
try {
    $null = Get-Command gh -ErrorAction Stop
    Write-Host "GitHub CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "GitHub CLI (gh) is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    Write-Host "GitHub CLI is authenticated" -ForegroundColor Green
} catch {
    Write-Host "Not authenticated with GitHub CLI. Please run: gh auth login" -ForegroundColor Red
    exit 1
}

# Get current repository
try {
    $repo = gh repo view --json nameWithOwner --jq '.nameWithOwner'
    Write-Host "Repository: $repo" -ForegroundColor Blue
} catch {
    Write-Host "Failed to get repository information" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up GitHub Actions secrets..." -ForegroundColor Yellow

# Function to set secret safely
function Set-GitHubSecret {
    param($Name, $Value)
    try {
        $null = echo $Value | gh secret set $Name
        Write-Host "Set $Name" -ForegroundColor Green
    } catch {
        Write-Host "Failed to set $Name" -ForegroundColor Red
    }
}


# Prompt user for secrets (never hardcode secrets in scripts)
$awsAccessKey = Read-Host "Enter your AWS_ACCESS_KEY_ID"
$awsSecretKey = Read-Host "Enter your AWS_SECRET_ACCESS_KEY"
$awsRegion = Read-Host "Enter your AWS_REGION"
$dockerUsername = Read-Host "Enter your DOCKER_USERNAME"
$dockerPassword = Read-Host "Enter your DOCKER_PASSWORD"
$githubToken = Read-Host "Enter your GITHUB_TOKEN_PERSONAL"

# Set secrets securely
Set-GitHubSecret "AWS_ACCESS_KEY_ID" $awsAccessKey
Set-GitHubSecret "AWS_SECRET_ACCESS_KEY" $awsSecretKey
Set-GitHubSecret "AWS_REGION" $awsRegion
Set-GitHubSecret "DOCKER_USERNAME" $dockerUsername
Set-GitHubSecret "DOCKER_PASSWORD" $dockerPassword
Set-GitHubSecret "GITHUB_TOKEN_PERSONAL" $githubToken

Write-Host ""
Write-Host "Optional secrets (you can set these later):" -ForegroundColor Yellow
Write-Host "   - SLACK_WEBHOOK_URL (for deployment notifications)" -ForegroundColor Gray
Write-Host "   - CODECOV_TOKEN (for code coverage)" -ForegroundColor Gray
Write-Host "   - SONAR_TOKEN (for SonarCloud analysis)" -ForegroundColor Gray
Write-Host "   - SNYK_TOKEN (for security scanning)" -ForegroundColor Gray

Write-Host ""
Write-Host "Note: AWS_ROLE_TO_ASSUME will be set automatically after first terraform apply" -ForegroundColor Blue

Write-Host ""
Write-Host "GitHub repository secrets configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your CI/CD pipeline is now ready to run with real integrations:" -ForegroundColor Cyan
Write-Host "   - AWS deployment with ECR, ECS, Aurora DSQL" -ForegroundColor Green
Write-Host "   - Docker Hub container registry" -ForegroundColor Green
Write-Host "   - GitHub Actions automation" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Push code to main/develop branch to trigger the pipeline" -ForegroundColor White
Write-Host "2. Monitor workflow execution in GitHub Actions tab" -ForegroundColor White
Write-Host "3. Check AWS console for deployed resources" -ForegroundColor White
