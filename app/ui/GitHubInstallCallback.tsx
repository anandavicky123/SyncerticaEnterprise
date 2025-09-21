"use client";
import React, { useEffect, useState } from "react";

type Installation = {
  id: number;
  account: { login: string; id: number; type: string };
  repository_selection: string;
  created_at: string;
};

export default function GitHubInstallCallback({
  managerGitHubLogin,
  auto = true,
}: {
  managerGitHubLogin?: string | null;
  auto?: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInstallations() {
    const res = await fetch("/api/github/app/installations", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch installations");
    const data = await res.json();
    return data.installations as Installation[];
  }

  async function persistInstallation(installationId: number) {
    const res = await fetch("/api/github/app/callback", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installation_id: installationId }),
    });
    return res.json();
  }

  async function runFlow() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const installations = await fetchInstallations();
      if (!installations || installations.length === 0) {
        setStatus("No installations found for this GitHub App yet. Try again in a few seconds.");
        setLoading(false);
        return;
      }

      // Prefer a match by managerGitHubLogin if provided
      let chosen = null as Installation | null;
      if (managerGitHubLogin) {
        chosen = installations.find((i) => i.account?.login === managerGitHubLogin) ?? null;
      }

      // fallback: choose the most recent by created_at
      if (!chosen) {
        chosen = installations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
      }

      if (!chosen) {
        setStatus("Unable to determine the installation to persist.");
        setLoading(false);
        return;
      }

      setStatus(`Persisting installation ${chosen.id} (account ${chosen.account.login})`);
      const result = await persistInstallation(chosen.id);

      if (result.success) {
        setStatus("Installation saved to your account.");
      } else if (result.error) {
        setError(result.error);
        setStatus(null);
      } else {
        setError("Unexpected response from server");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => runFlow().catch(console.error), 300); // small delay to let webhook arrive
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return (
    <div className="github-install-callback">
      <div>
        {loading ? <div>Processing installation...</div> : null}
        {status ? <div>{status}</div> : null}
        {error ? <div style={{ color: "red" }}>{error}</div> : null}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => runFlow()} disabled={loading} className="btn">
          Try to finish install now
        </button>
      </div>
    </div>
  );
}
