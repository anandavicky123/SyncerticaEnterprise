#!/bin/bash

# GitHub Repository Secrets Configuration Script
# This script helps configure the required secrets for GitHub Actions CI/CD pipeline

set -e

echo "🔐 GitHub Repository Secrets Configuration"
echo "=========================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"

# Get current repository
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
echo "📁 Repository: $REPO"

echo ""
echo "🔑 Setting up GitHub Actions secrets..."

# AWS Secrets
echo "Setting AWS_ACCESS_KEY_ID..."
gh secret set AWS_ACCESS_KEY_ID --body "***REMOVED***"

echo "Setting AWS_SECRET_ACCESS_KEY..."
gh secret set AWS_SECRET_ACCESS_KEY --body "***REMOVED***"

echo "Setting AWS_REGION..."
gh secret set AWS_REGION --body "us-east-1"

# Docker Hub Secrets
echo "Setting DOCKER_USERNAME..."
gh secret set DOCKER_USERNAME --body "***REMOVED***"

echo "Setting DOCKER_PASSWORD..."
gh secret set DOCKER_PASSWORD --body "***REMOVED***"

# GitHub Token (for API access)
echo "Setting GITHUB_TOKEN_PERSONAL..."
gh secret set GITHUB_TOKEN_PERSONAL --body "***REMOVED***"

# Notification secrets (optional)
echo ""
echo "⚠️  Optional secrets (you can set these later):"
echo "   - SLACK_WEBHOOK_URL (for deployment notifications)"
echo "   - CODECOV_TOKEN (for code coverage)"
echo "   - SONAR_TOKEN (for SonarCloud analysis)"
echo "   - SNYK_TOKEN (for security scanning)"

# AWS Role ARN (will be created during first terraform apply)
echo ""
echo "📝 Note: AWS_ROLE_TO_ASSUME will be set automatically after first terraform apply"

echo ""
echo "✅ GitHub repository secrets configured successfully!"
echo ""
echo "🚀 Your CI/CD pipeline is now ready to run with real integrations:"
echo "   ✓ AWS deployment with ECR, ECS, Aurora DSQL"
echo "   ✓ Docker Hub container registry"
echo "   ✓ GitHub Actions automation"
echo ""
echo "Next steps:"
echo "1. Push code to main/develop branch to trigger the pipeline"
echo "2. Monitor workflow execution in GitHub Actions tab"
echo "3. Check AWS console for deployed resources"
