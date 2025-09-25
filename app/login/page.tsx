"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Database } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [isGeneratingMockData, setIsGeneratingMockData] = useState(false);
  const [error, setError] = useState("");

  const handleManagerLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Get or generate manager UUID
      let managerUUID = localStorage.getItem("manager-uuid");
      const isNewManager = !managerUUID;

      if (!managerUUID) {
        managerUUID = uuidv4();
        localStorage.setItem("manager-uuid", managerUUID);
      }

      // If this is a new manager, show mock data generation message
      if (isNewManager) {
        setIsGeneratingMockData(true);
      }

      // Create or get manager session
      const response = await fetch("/api/auth/manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceUUID: managerUUID,
          name: "Manager",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create manager session");
      }

      console.log("Manager authentication response:", data);

      // Set session cookie with environment-based secure flag
      const cookieString = `session-id=${data.sessionId}; path=/; max-age=${
        24 * 60 * 60
      }; ${
        process.env.NODE_ENV === "development" ? "" : "secure; "
      }samesite=lax`;
      document.cookie = cookieString;
      console.log("Setting cookie:", cookieString);

      // Verify cookie was set
      console.log("All cookies after setting:", document.cookie);

      console.log("Cookie set, now redirecting to /dashboard");
      // Force a complete page reload to ensure new cookie is used
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Manager access error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to access manager dashboard",
      );
    } finally {
      setLoading(false);
      setIsGeneratingMockData(false);
    }
  };

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/worker/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Set worker session cookie with environment-based secure flag
      document.cookie = `session-id=${data.sessionId}; path=/; max-age=${
        24 * 60 * 60
      }; ${
        process.env.NODE_ENV === "development" ? "" : "secure; "
      }samesite=lax`;

      // Force a complete page reload to ensure new cookie is used
      window.location.href = "/tasks";
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left: Illustration / Marketing */}
        <div className="hidden md:flex flex-col justify-center items-start p-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Syncertica Enterprise
            </h2>
            <p className="mt-2 text-blue-100 max-w-xs">
              A modern workplace for DevOps, chat, and task management — sign in
              to continue.
            </p>
          </div>

          <div className="mt-auto w-full">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-blue-100">
                Manager access gives full control over projects and workers.
                Worker access shows assigned tasks.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="p-8 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">
                Welcome back
              </h3>
              <p className="text-sm text-slate-500">
                Choose your role or sign in to continue
              </p>
            </div>
            <div className="hidden md:block">
              <Link
                href="/"
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 rounded-md p-3">
              <p className="text-rose-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Manager CTA */}
            <button
              onClick={handleManagerLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-slate-900 text-white py-3 px-4 hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  {isGeneratingMockData ? (
                    <Database className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  )}
                  <span className="font-medium">
                    {isGeneratingMockData
                      ? "Setting up workspace…"
                      : "Continue as Manager"}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
                    />
                  </svg>
                  <span className="font-medium">Manager Dashboard</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <div className="text-xs text-slate-400">or</div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Worker Form Toggle / Form */}
            {!showWorkerForm ? (
              <button
                onClick={() => setShowWorkerForm(true)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-3 px-4 hover:bg-slate-50 disabled:opacity-60 transition"
              >
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium text-slate-700">
                  Sign in as Worker
                </span>
              </button>
            ) : (
              <form onSubmit={handleWorkerLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-md bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWorkerForm(false)}
                    className="flex-1 rounded-md border border-slate-200 py-2 px-4 text-slate-700 hover:bg-slate-50"
                  >
                    Back to options
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>
              By continuing you agree to the{" "}
              <a href="#" className="text-slate-600 underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-slate-600 underline">
                Privacy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
