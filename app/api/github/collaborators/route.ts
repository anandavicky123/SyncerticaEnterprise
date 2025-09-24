import { NextRequest, NextResponse } from "next/server";
import { getInstallationTokenForRepo } from "@/lib/github-app";

// GET /api/github/collaborators?repo=owner/name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");
    if (!repo)
      return NextResponse.json({ error: "repo is required" }, { status: 400 });
    const [owner, name] = repo.split("/");
    const inst = await getInstallationTokenForRepo(owner, name);
    if (!inst)
      return NextResponse.json(
        { error: "No installation for repo" },
        { status: 403 },
      );

    const collabRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/collaborators`,
      {
        headers: {
          Authorization: `token ${inst.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!collabRes.ok) {
      const errorText = await collabRes.text();
      console.error(
        `Failed to fetch collaborators for ${owner}/${name}:`,
        collabRes.status,
        errorText,
      );
      return NextResponse.json(
        {
          error: `Failed to fetch collaborators: ${collabRes.status}`,
          details: errorText,
          suggestion:
            collabRes.status === 403
              ? "GitHub App may lack 'Members' permission. Check App settings in GitHub."
              : "Check repository access and permissions.",
        },
        { status: collabRes.status },
      );
    }

    const collaborators = await collabRes.json();

    // Also fetch pending invitations
    const invitesRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/invitations`,
      {
        headers: {
          Authorization: `token ${inst.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    // Invitations might fail if no permission, but don't fail the whole request
    let invitations = [];
    if (invitesRes.ok) {
      invitations = await invitesRes.json();
    } else {
      console.warn(
        `Failed to fetch invitations for ${owner}/${name}:`,
        invitesRes.status,
      );
    }

    return NextResponse.json({ collaborators, invitations });
  } catch (e) {
    console.error("List collaborators error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/github/collaborators { repo, username, permission }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, username, email, permission = "push" } = body || {};
    if (!repo) {
      return NextResponse.json({ error: "repo is required" }, { status: 400 });
    }

    // We do not support inviting by email on repository level; GitHub API requires a username for repo collaborators.
    // See: PUT /repos/{owner}/{repo}/collaborators/{username}
    if (email && !username) {
      return NextResponse.json(
        {
          error:
            "Inviting by email is not supported for repositories. Please provide the collaborator's GitHub username.",
        },
        { status: 400 },
      );
    }
    if (!username) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 },
      );
    }
    const [owner, name] = (repo as string).split("/");
    const inst = await getInstallationTokenForRepo(owner, name);
    if (!inst)
      return NextResponse.json(
        { error: "No installation for repo" },
        { status: 403 },
      );

    // username path (invite or add collaborator)
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${name}/collaborators/${encodeURIComponent(
        username,
      )}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${inst.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permission }),
      },
    );

    if (res.status === 204) {
      return NextResponse.json({ success: true });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Add collaborator error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/github/collaborators { repo, username }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, username } = body || {};
    if (!repo || !username) {
      return NextResponse.json(
        { error: "repo and username required" },
        { status: 400 },
      );
    }
    const [owner, name] = (repo as string).split("/");
    const inst = await getInstallationTokenForRepo(owner, name);
    if (!inst)
      return NextResponse.json(
        { error: "No installation for repo" },
        { status: 403 },
      );

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${name}/collaborators/${encodeURIComponent(
        username,
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${inst.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (res.status === 204) return NextResponse.json({ success: true });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Remove collaborator error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
