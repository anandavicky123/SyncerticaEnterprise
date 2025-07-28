# 🚀 GitHub Actions Integration Setup Guide

## 📋 Prerequisites

1. **GitHub Repository**: https://github.com/anandavicky123/syncerticaenterprise
2. **GitHub Personal Access Token** with the following scopes:
   - `repo` (Full repository access)
   - `workflow` (Update GitHub Action workflows)
3. **AWS Account** with appropriate permissions for deployment

## 🔧 Setup Instructions

### 1. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token (classic) with these permissions:
   - ✅ `repo` - Full control of private repositories
   - ✅ `workflow` - Update GitHub Action workflows
3. Copy the token and add it to your `.env.local` file:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Environment Variables

Create `.env.local` file in the project root:

```env
# GitHub Configuration
NEXT_PUBLIC_GITHUB_OWNER=anandavicky123
NEXT_PUBLIC_GITHUB_REPO=syncerticaenterprise
GITHUB_TOKEN=your_github_token_here

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 3. GitHub Repository Secrets

Add the following secrets to your GitHub repository:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add these secrets:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
GITHUB_TOKEN=your_github_token (for advanced features)
```

### 4. AWS IAM Setup

Create an IAM user with these policies:

- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonECS_FullAccess`
- `CloudFormationFullAccess`
- `IAMFullAccess` (for Terraform)

## 🔄 GitHub Actions Workflow

The CI/CD pipeline is already configured in `.github/workflows/ci-cd.yml` with:

### ✅ **Features Included:**

1. **Code Quality & Testing**

   - ESLint and Prettier checks
   - TypeScript compilation
   - Unit tests with Jest
   - End-to-end tests with Playwright
   - Test coverage reports

2. **Security Scanning**

   - npm audit for vulnerabilities
   - Snyk security scanning
   - CodeQL static analysis
   - Container image scanning

3. **Build & Deploy**

   - Docker image building
   - Push to Amazon ECR
   - Deploy to AWS ECS Fargate
   - Terraform infrastructure deployment

4. **Infrastructure**

   - Terraform validation and planning
   - Infrastructure deployment to staging/production
   - AWS resource management

5. **Monitoring**
   - Post-deployment health checks
   - CloudWatch metrics setup
   - Slack notifications (optional)

## 📊 Real-time Integration

The DevOpsPipeline component now shows:

- ✅ **Live GitHub Actions workflow runs**
- ✅ **Real-time build status updates**
- ✅ **Job execution details and logs**
- ✅ **AWS deployment status**
- ✅ **Pipeline statistics and metrics**
- ✅ **Artifact downloads**

## 🎯 Dashboard Features

### **Real GitHub Actions Data:**

- Workflow run status (success, failed, running, pending)
- Build duration and timestamps
- Branch and commit information
- Author details
- Job-level details with logs

### **AWS Integration:**

- ECR container registry status
- ECS deployment status
- Terraform infrastructure state
- CloudWatch monitoring integration

### **Interactive Features:**

- Click to view workflow details on GitHub
- Real-time status updates every 30 seconds
- Manual pipeline triggers
- Artifact downloads
- Log viewing

## 🔍 API Endpoints

The GitHub Actions service provides:

```typescript
// Get all workflow runs
const runs = await githubActionsService.getWorkflowRuns();

// Get specific workflow jobs
const jobs = await githubActionsService.getWorkflowRunJobs(runId);

// Trigger a workflow
await githubActionsService.triggerWorkflow(workflowId, "main");

// Get deployment status
const deployments = await githubActionsService.getAWSDeploymentStatus();
```

## 🚨 Troubleshooting

### Common Issues:

1. **GitHub API Rate Limits**

   - Solution: Add `GITHUB_TOKEN` to increase rate limits

2. **403 Unauthorized**

   - Check token permissions and scopes
   - Ensure token has `repo` and `workflow` access

3. **No Data Showing**

   - Verify repository name and owner in environment variables
   - Check if workflows exist in `.github/workflows/`

4. **AWS Deployment Failures**
   - Verify AWS credentials and permissions
   - Check Terraform state and resources

## 📈 Monitoring

The dashboard provides:

- Success rate calculations
- Average build time metrics
- Total build counts
- Real-time running pipeline count
- AWS deployment status per environment

## 🎉 Ready to Use!

Once configured, your DevOps Pipeline dashboard will show:

- ✅ Live GitHub Actions workflows
- ✅ Real AWS deployment status
- ✅ Interactive pipeline management
- ✅ Comprehensive monitoring

**No more mocked data - everything is now connected to real GitHub Actions and AWS services!**
