import { NextRequest, NextResponse } from "next/server";
import { getInstallationTokenForRepo } from "@/lib/github-app";

// GET: /api/github/contents?repo=owner/name&path=path/to/file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");
    if (!repo || !path) {
      return NextResponse.json(
        { error: "repo and path are required" },
        { status: 400 }
      );
    }
    const [owner, name] = repo.split("/");
    const inst = await getInstallationTokenForRepo(owner, name);
    if (!inst)
      return NextResponse.json(
        { error: "No installation for repo" },
        { status: 403 }
      );

    const gh = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(
        path
      )}`,
      {
        headers: {
          Authorization: `token ${inst.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    const data = await gh.json();
    return NextResponse.json(data, { status: gh.status });
  } catch (e) {
    console.error("GET contents error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT: /api/github/contents with body { repo, path, content(base64), sha?, message }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, path, content, sha, message } = body || {};
    if (!repo || !path || !content || !message) {
      return NextResponse.json(
        { error: "repo, path, content, message required" },
        { status: 400 }
      );
    }
    const [owner, name] = (repo as string).split("/");
    const inst = await getInstallationTokenForRepo(owner, name);
    if (!inst)
      return NextResponse.json(
        { error: "No installation for repo" },
        { status: 403 }
      );

    const gh = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(
        path
      )}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${inst.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, content, sha }),
      }
    );

    const data = await gh.json().catch(() => ({}));
    return NextResponse.json(data, { status: gh.status });
  } catch (e) {
    console.error("PUT contents error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
