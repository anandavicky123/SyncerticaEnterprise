import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple in-memory cache to avoid hitting GitHub API too frequently
let infrastructureCache: Map<
  string,
  {
    data: any[];
    timestamp: number;
  }
> = new Map();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("github_access_token")?.value;
    const { searchParams } = new URL(request.url);
    const repoName = searchParams.get("repo");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated", infrastructure: [] },
        { status: 401 }
      );
    }

    console.log("🔍 Infrastructure API called for repo:", repoName);

    // If no specific repo, get infrastructure from all repos
    if (!repoName) {
      return await getAllInfrastructure(accessToken);
    }

    // Check cache first
    const cacheKey = repoName;
    const cachedData = infrastructureCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log("🏗️ Returning cached infrastructure data for", repoName);
      return NextResponse.json({
        infrastructure: cachedData.data,
        total: cachedData.data.length,
        cached: true,
      });
    }

    console.log("🏗️ Fetching infrastructure files for:", repoName);

    // Get repository tree recursively
    const treeResponse = await fetch(
      `https://api.github.com/repos/${repoName}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SyncerticaEnterprise",
        },
      }
    );

    if (!treeResponse.ok) {
      throw new Error(
        `Failed to fetch repository tree: ${treeResponse.status}`
      );
    }

    const treeData = await treeResponse.json();
    const allFiles = treeData.tree || [];

    console.log(`🔍 Found ${allFiles.length} files in ${repoName}`);

    // Define infrastructure file patterns
    const infrastructurePatterns = [
      { pattern: /\.tf$/, type: "Terraform" },
      { pattern: /\.tfvars$/, type: "Terraform Variables" },
      { pattern: /\.hcl$/, type: "HCL" },
      { pattern: /terraform\.tfstate$/, type: "Terraform State" },
      {
        pattern: /terraform\.tfstate\.backup$/,
        type: "Terraform State Backup",
      },
      { pattern: /main\.tf$/, type: "Terraform Main" },
      { pattern: /variables\.tf$/, type: "Terraform Variables" },
      { pattern: /outputs\.tf$/, type: "Terraform Outputs" },
      { pattern: /providers\.tf$/, type: "Terraform Providers" },
      { pattern: /versions\.tf$/, type: "Terraform Versions" },
      { pattern: /\.terraformrc$/, type: "Terraform Config" },
      { pattern: /terraform\.rc$/, type: "Terraform Config" },
      { pattern: /cloudformation\.ya?ml$/, type: "CloudFormation" },
      { pattern: /cloudformation\.json$/, type: "CloudFormation" },
      { pattern: /template\.ya?ml$/, type: "CloudFormation Template" },
      { pattern: /serverless\.ya?ml$/, type: "Serverless" },
      { pattern: /ansible\.ya?ml$/, type: "Ansible" },
      { pattern: /playbook\.ya?ml$/, type: "Ansible Playbook" },
      { pattern: /inventory\.ya?ml$/, type: "Ansible Inventory" },
      { pattern: /Pulumi\.ya?ml$/, type: "Pulumi" },
      { pattern: /\.pulumi$/, type: "Pulumi" },
      { pattern: /helm-chart\.ya?ml$/, type: "Helm Chart" },
      { pattern: /Chart\.ya?ml$/, type: "Helm Chart" },
      { pattern: /values\.ya?ml$/, type: "Helm Values" },
      { pattern: /skaffold\.ya?ml$/, type: "Skaffold" },
      { pattern: /kustomization\.ya?ml$/, type: "Kustomize" },
      { pattern: /\.cdk\.json$/, type: "AWS CDK" },
      { pattern: /cdk\.json$/, type: "AWS CDK" },
      { pattern: /appspec\.ya?ml$/, type: "AWS CodeDeploy" },
      { pattern: /buildspec\.ya?ml$/, type: "AWS CodeBuild" },
      { pattern: /\.circleci\/config\.ya?ml$/, type: "CircleCI" },
      { pattern: /azure-pipelines\.ya?ml$/, type: "Azure DevOps" },
      { pattern: /\.gitlab-ci\.ya?ml$/, type: "GitLab CI" },
      { pattern: /Jenkinsfile$/, type: "Jenkins" },
      { pattern: /infrastructure\/.*\.ya?ml$/, type: "Infrastructure Config" },
      { pattern: /terraform\/.*\.tf$/, type: "Terraform Module" },
      { pattern: /modules\/.*\.tf$/, type: "Terraform Module" },
    ];

    // Filter infrastructure files
    const infrastructureFiles = allFiles.filter((file: any) => {
      if (file.type !== "blob") return false;

      return infrastructurePatterns.some(({ pattern }) =>
        pattern.test(file.path)
      );
    });

    console.log(
      `🏗️ Found ${infrastructureFiles.length} infrastructure files in ${repoName}`
    );

    // Transform to our format
    const transformedFiles = infrastructureFiles.map((file: any) => {
      const matchedPattern = infrastructurePatterns.find(({ pattern }) =>
        pattern.test(file.path)
      );

      return {
        id: `${repoName}-${file.sha}`,
        name: file.path.split("/").pop() || file.path,
        type: matchedPattern?.type || "Infrastructure",
        path: file.path,
        repository: repoName,
        content: "", // Content would need separate API call
        download_url: `https://api.github.com/repos/${repoName}/contents/${file.path}`,
        html_url: `https://github.com/${repoName}/blob/HEAD/${file.path}`,
        size: file.size || 0,
        sha: file.sha,
      };
    });

    // Cache the results
    infrastructureCache.set(cacheKey, {
      data: transformedFiles,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      infrastructure: transformedFiles,
      total: transformedFiles.length,
    });
  } catch (error) {
    console.error("❌ Error fetching infrastructure:", error);
    return NextResponse.json(
      { error: "Failed to fetch infrastructure", infrastructure: [] },
      { status: 500 }
    );
  }
}

async function getAllInfrastructure(accessToken: string) {
  try {
    console.log("🏗️ Fetching infrastructure from all repositories...");

    // First, get all repositories
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SyncerticaEnterprise",
        },
      }
    );

    if (!reposResponse.ok) {
      throw new Error(`Failed to fetch repositories: ${reposResponse.status}`);
    }

    const repositories = await reposResponse.json();
    console.log(`✅ Found ${repositories.length} repositories`);

    const allInfrastructure: any[] = [];

    // Search for infrastructure files in each repository
    for (const repo of repositories.slice(0, 10)) {
      // Limit to first 10 repos to avoid rate limiting
      try {
        const treeResponse = await fetch(
          `https://api.github.com/repos/${repo.full_name}/git/trees/HEAD?recursive=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "SyncerticaEnterprise",
            },
          }
        );

        if (treeResponse.ok) {
          const treeData = await treeResponse.json();
          const allFiles = treeData.tree || [];

          // Infrastructure file patterns
          const infrastructurePatterns = [
            { pattern: /\.tf$/, type: "Terraform" },
            { pattern: /\.tfvars$/, type: "Terraform Variables" },
            { pattern: /cloudformation\.ya?ml$/, type: "CloudFormation" },
            { pattern: /serverless\.ya?ml$/, type: "Serverless" },
            { pattern: /appspec\.ya?ml$/, type: "AWS CodeDeploy" },
            { pattern: /buildspec\.ya?ml$/, type: "AWS CodeBuild" },
          ];

          const infrastructureFiles = allFiles.filter((file: any) => {
            if (file.type !== "blob") return false;
            return infrastructurePatterns.some(({ pattern }) =>
              pattern.test(file.path)
            );
          });

          const transformedFiles = infrastructureFiles.map((file: any) => {
            const matchedPattern = infrastructurePatterns.find(({ pattern }) =>
              pattern.test(file.path)
            );

            return {
              id: `${repo.full_name}-${file.sha}`,
              name: file.path.split("/").pop() || file.path,
              type: matchedPattern?.type || "Infrastructure",
              path: file.path,
              repository: repo.full_name,
              content: "",
              download_url: `https://api.github.com/repos/${repo.full_name}/contents/${file.path}`,
              html_url: `https://github.com/${repo.full_name}/blob/HEAD/${file.path}`,
              size: file.size || 0,
              sha: file.sha,
            };
          });

          allInfrastructure.push(...transformedFiles);
          console.log(
            `🏗️ Found ${transformedFiles.length} infrastructure files in ${repo.full_name}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error checking infrastructure in ${repo.full_name}:`,
          error
        );
        continue;
      }
    }

    console.log(
      `✅ Infrastructure search complete. Found ${allInfrastructure.length} total files`
    );

    return NextResponse.json({
      infrastructure: allInfrastructure,
      total: allInfrastructure.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all infrastructure:", error);
    return NextResponse.json(
      { error: "Failed to fetch infrastructure", infrastructure: [] },
      { status: 500 }
    );
  }
}
