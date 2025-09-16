import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple in-memory cache to avoid hitting GitHub API too frequently
let containerCache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  console.log("🔍 Container API called");

  // Check cache first
  if (
    containerCache &&
    Date.now() - containerCache.timestamp < CACHE_DURATION
  ) {
    console.log("📦 Returning cached container data");
    return NextResponse.json({
      containers: containerCache.data,
      total: containerCache.data.length,
      cached: true,
    });
  }

  try {
    const cookieStore = await cookies();
    const githubToken = cookieStore.get("github_access_token")?.value;

    if (!githubToken) {
      console.log("❌ No GitHub token found");
      return NextResponse.json(
        { error: "GitHub token not found", containers: [] },
        { status: 401 }
      );
    }

    console.log("✅ GitHub token found, fetching repositories...");

    // First, get all repositories
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
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

    const allContainers: any[] = [];

    // Search for container files in each repository
    for (const repo of repositories) {
      console.log(`🔍 Searching for container files in ${repo.full_name}...`);

      try {
        // Check for Dockerfile
        const dockerfileResponse = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/Dockerfile`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "SyncerticaEnterprise",
            },
          }
        );

        if (dockerfileResponse.ok) {
          const dockerfileData = await dockerfileResponse.json();
          allContainers.push({
            id: `${repo.full_name}-dockerfile`,
            name: "Dockerfile",
            type: "Dockerfile",
            path: "Dockerfile",
            repository: repo.full_name,
            content: dockerfileData.content || "",
            download_url: dockerfileData.download_url,
            html_url: dockerfileData.html_url,
            size: dockerfileData.size,
          });
          console.log(`📦 Found Dockerfile in ${repo.full_name}`);
        }

        // Check for docker-compose files
        const composeFiles = [
          "docker-compose.yml",
          "docker-compose.yaml",
          "compose.yml",
          "compose.yaml",
        ];
        for (const composeFile of composeFiles) {
          try {
            const composeResponse = await fetch(
              `https://api.github.com/repos/${repo.full_name}/contents/${composeFile}`,
              {
                headers: {
                  Authorization: `Bearer ${githubToken}`,
                  Accept: "application/vnd.github.v3+json",
                  "User-Agent": "SyncerticaEnterprise",
                },
              }
            );

            if (composeResponse.ok) {
              const composeData = await composeResponse.json();
              allContainers.push({
                id: `${repo.full_name}-${composeFile}`,
                name: composeFile,
                type: "Docker Compose",
                path: composeFile,
                repository: repo.full_name,
                content: composeData.content || "",
                download_url: composeData.download_url,
                html_url: composeData.html_url,
                size: composeData.size,
              });
              console.log(`📦 Found ${composeFile} in ${repo.full_name}`);
              break; // Only add one compose file per repo
            }
          } catch (error) {
            // Continue if this specific file doesn't exist
            continue;
          }
        }

        // Check for Kubernetes files
        try {
          const k8sResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/contents/k8s`,
            {
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "SyncerticaEnterprise",
              },
            }
          );

          if (k8sResponse.ok) {
            const k8sData = await k8sResponse.json();
            if (Array.isArray(k8sData)) {
              const yamlFiles = k8sData.filter(
                (file: any) =>
                  file.name.endsWith(".yaml") || file.name.endsWith(".yml")
              );

              for (const yamlFile of yamlFiles.slice(0, 3)) {
                // Limit to first 3 files
                allContainers.push({
                  id: `${repo.full_name}-k8s-${yamlFile.name}`,
                  name: yamlFile.name,
                  type: "Kubernetes",
                  path: `k8s/${yamlFile.name}`,
                  repository: repo.full_name,
                  content: "",
                  download_url: yamlFile.download_url,
                  html_url: yamlFile.html_url,
                  size: yamlFile.size,
                });
                console.log(
                  `📦 Found K8s file ${yamlFile.name} in ${repo.full_name}`
                );
              }
            }
          }
        } catch (error) {
          // K8s directory might not exist, continue
        }

        // Check for .dockerignore
        try {
          const dockerignoreResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/contents/.dockerignore`,
            {
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "SyncerticaEnterprise",
              },
            }
          );

          if (dockerignoreResponse.ok) {
            const dockerignoreData = await dockerignoreResponse.json();
            allContainers.push({
              id: `${repo.full_name}-dockerignore`,
              name: ".dockerignore",
              type: "Docker Ignore",
              path: ".dockerignore",
              repository: repo.full_name,
              content: dockerignoreData.content || "",
              download_url: dockerignoreData.download_url,
              html_url: dockerignoreData.html_url,
              size: dockerignoreData.size,
            });
            console.log(`📦 Found .dockerignore in ${repo.full_name}`);
          }
        } catch (error) {
          // .dockerignore might not exist, continue
        }
      } catch (error) {
        console.error(
          `❌ Error checking container files in ${repo.full_name}:`,
          error
        );
        continue;
      }
    }

    console.log(
      `✅ Container search complete. Found ${allContainers.length} total containers`
    );

    // Cache the results
    containerCache = {
      data: allContainers,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      containers: allContainers,
      total: allContainers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching containers:", error);

    // If we have cached data, return it on error
    if (containerCache) {
      console.log("🔄 API error, returning cached data");
      return NextResponse.json({
        containers: containerCache.data,
        total: containerCache.data.length,
        cached: true,
        error: "API temporarily unavailable, showing cached data",
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch containers", containers: [] },
      { status: 500 }
    );
  }
}
