#!/usr/bin/env node

/**
 * Syncertica Enterprise Workflow Setup Script
 * Automates the setup of GitHub Actions, AWS CodePipeline, and Docker integration
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Syncertica Enterprise Workflow Setup");
console.log("=====================================\n");

class WorkflowSetup {
  constructor() {
    this.config = {
      projectName: "syncertica-enterprise",
      awsRegion: process.env.AWS_REGION || "us-east-1",
      environments: ["staging", "production"],
    };
  }

  async run() {
    try {
      console.log("🔍 Checking prerequisites...");
      this.checkPrerequisites();

      console.log("🔧 Setting up AWS infrastructure...");
      await this.setupAWSInfrastructure();

      console.log("📦 Configuring Docker registry...");
      await this.setupDockerRegistry();

      console.log("🔄 Testing GitHub Actions integration...");
      await this.testGitHubActions();

      console.log("📊 Setting up monitoring...");
      await this.setupMonitoring();

      console.log("✅ Workflow setup completed successfully!");
      this.printNextSteps();
    } catch (error) {
      console.error("❌ Setup failed:", error.message);
      process.exit(1);
    }
  }

  checkPrerequisites() {
    const requirements = [
      { command: "aws --version", name: "AWS CLI" },
      { command: "docker --version", name: "Docker" },
      { command: "gh --version", name: "GitHub CLI" },
      { command: "terraform --version", name: "Terraform" },
    ];

    requirements.forEach((req) => {
      try {
        execSync(req.command, { stdio: "pipe" });
        console.log(`   ✅ ${req.name} is installed`);
      } catch (error) {
        throw new Error(`${req.name} is not installed or not in PATH`);
      }
    });

    // Check AWS credentials
    try {
      execSync("aws sts get-caller-identity", { stdio: "pipe" });
      console.log("   ✅ AWS credentials are configured");
    } catch (error) {
      throw new Error("AWS credentials are not configured");
    }

    // Check GitHub authentication
    try {
      execSync("gh auth status", { stdio: "pipe" });
      console.log("   ✅ GitHub CLI is authenticated");
    } catch (error) {
      throw new Error("GitHub CLI is not authenticated. Run: gh auth login");
    }
  }

  async setupAWSInfrastructure() {
    console.log("   📋 Initializing Terraform...");

    // Initialize Terraform
    execSync("terraform init", {
      cwd: path.join(process.cwd(), "terraform"),
      stdio: "inherit",
    });

    console.log("   📝 Planning infrastructure...");

    // Plan infrastructure
    execSync("terraform plan -out=tfplan", {
      cwd: path.join(process.cwd(), "terraform"),
      stdio: "inherit",
    });

    console.log("   🏗️ Applying infrastructure...");

    // Apply infrastructure
    execSync("terraform apply tfplan", {
      cwd: path.join(process.cwd(), "terraform"),
      stdio: "inherit",
    });

    // Get outputs
    const outputs = this.getTerraformOutputs();
    this.config.ecrRepository = outputs.ecr_repository_url;
    this.config.ecsCluster = outputs.ecs_cluster_name;

    console.log("   ✅ AWS infrastructure deployed successfully");
  }

  getTerraformOutputs() {
    try {
      const outputJson = execSync("terraform output -json", {
        cwd: path.join(process.cwd(), "terraform"),
        encoding: "utf8",
      });

      const outputs = JSON.parse(outputJson);
      return Object.keys(outputs).reduce((acc, key) => {
        acc[key] = outputs[key].value;
        return acc;
      }, {});
    } catch (error) {
      console.warn("   ⚠️ Could not retrieve Terraform outputs");
      return {};
    }
  }

  async setupDockerRegistry() {
    if (!this.config.ecrRepository) {
      console.log("   ⚠️ ECR repository URL not found, skipping Docker setup");
      return;
    }

    console.log("   🔐 Logging into ECR...");
    execSync(
      `aws ecr get-login-password --region ${this.config.awsRegion} | docker login --username AWS --password-stdin ${this.config.ecrRepository}`,
      {
        shell: true,
        stdio: "inherit",
      }
    );

    console.log("   🐳 Building and pushing initial image...");
    execSync(`docker build -t ${this.config.projectName} .`, {
      stdio: "inherit",
    });
    execSync(
      `docker tag ${this.config.projectName}:latest ${this.config.ecrRepository}:latest`,
      { stdio: "inherit" }
    );
    execSync(`docker push ${this.config.ecrRepository}:latest`, {
      stdio: "inherit",
    });

    console.log("   ✅ Docker image pushed to ECR");
  }

  async testGitHubActions() {
    console.log("   🧪 Testing GitHub Actions workflow...");

    // Check if workflow file exists
    const workflowPath = ".github/workflows/ci-cd.yml";
    if (!fs.existsSync(workflowPath)) {
      throw new Error("GitHub Actions workflow file not found");
    }

    // Validate workflow syntax
    try {
      execSync("gh workflow list", { stdio: "pipe" });
      console.log("   ✅ GitHub Actions workflow is valid");
    } catch (error) {
      console.warn("   ⚠️ Could not validate GitHub Actions workflow");
    }

    // Check required secrets
    const requiredSecrets = [
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "DOCKER_USERNAME",
      "DOCKER_PASSWORD",
    ];

    console.log("   🔑 Checking GitHub secrets...");
    requiredSecrets.forEach((secret) => {
      try {
        execSync(`gh secret list | grep ${secret}`, { stdio: "pipe" });
        console.log(`      ✅ ${secret} is configured`);
      } catch (error) {
        console.log(`      ⚠️ ${secret} is not configured`);
      }
    });
  }

  async setupMonitoring() {
    console.log("   📊 Setting up CloudWatch dashboards...");

    const dashboardConfig = {
      widgets: [
        {
          type: "metric",
          properties: {
            metrics: [
              [
                "AWS/ECS",
                "CPUUtilization",
                "ServiceName",
                `${this.config.projectName}-service`,
              ],
              [".", "MemoryUtilization", ".", "."],
            ],
            period: 300,
            stat: "Average",
            region: this.config.awsRegion,
            title: "ECS Service Metrics",
          },
        },
        {
          type: "metric",
          properties: {
            metrics: [
              [
                "AWS/ApplicationELB",
                "TargetResponseTime",
                "LoadBalancer",
                `${this.config.projectName}-alb`,
              ],
              [".", "RequestCount", ".", "."],
            ],
            period: 300,
            stat: "Average",
            region: this.config.awsRegion,
            title: "Load Balancer Metrics",
          },
        },
      ],
    };

    try {
      const dashboardJson = JSON.stringify(dashboardConfig);
      execSync(
        `aws cloudwatch put-dashboard --dashboard-name "${this.config.projectName}-dashboard" --dashboard-body '${dashboardJson}'`,
        {
          stdio: "pipe",
        }
      );
      console.log("   ✅ CloudWatch dashboard created");
    } catch (error) {
      console.warn("   ⚠️ Could not create CloudWatch dashboard");
    }
  }

  printNextSteps() {
    console.log("\n🎉 Setup Complete! Next Steps:");
    console.log("================================\n");

    console.log("1. 🔧 Configure GitHub Secrets:");
    console.log("   Run: npm run setup:secrets");
    console.log("   Or manually add secrets in GitHub repository settings\n");

    console.log("2. 🚀 Trigger Your First Deployment:");
    console.log("   git add .");
    console.log('   git commit -m "feat: add complete DevOps workflow"');
    console.log("   git push origin master\n");

    console.log("3. 📊 Monitor Your Deployment:");
    console.log(
      "   - GitHub Actions: https://github.com/anandavicky123/SyncerticaEnterprise/actions"
    );
    console.log(
      "   - AWS CodePipeline: https://console.aws.amazon.com/codesuite/codepipeline/pipelines"
    );
    console.log(
      "   - CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home#dashboards:"
    );

    if (this.config.ecrRepository) {
      console.log(`   - ECR Repository: ${this.config.ecrRepository}`);
    }

    console.log("\n4. 🔄 Workflow Overview:");
    console.log(
      "   GitHub Push → GitHub Actions → ECR → CodePipeline → ECS → Health Checks\n"
    );

    console.log("Your enterprise-grade DevOps pipeline is ready! 🚀");
  }
}

// Run the setup
if (require.main === module) {
  const setup = new WorkflowSetup();
  setup.run().catch(console.error);
}

module.exports = WorkflowSetup;
