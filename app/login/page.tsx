"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Shield, UserCircle2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleManagerLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Get or generate manager UUID
      let managerUUID = localStorage.getItem("manager-uuid");
      if (!managerUUID) {
        managerUUID = uuidv4();
        localStorage.setItem("manager-uuid", managerUUID);
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

      // Set new manager session cookie with explicit attributes
      const cookieString = `session-id=${data.sessionId}; path=/; max-age=${
        24 * 60 * 60
      }; samesite=lax`;
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
          : "Failed to access manager dashboard"
      );
    } finally {
      setLoading(false);
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

      // Set new worker session cookie
      document.cookie = `session-id=${data.sessionId}; path=/; max-age=${
        24 * 60 * 60
      }; samesite=lax`;

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your role to continue
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Manager Option */}
          <button
            onClick={handleManagerLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-6 border border-gray-300 shadow-sm text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Shield className="w-6 h-6 mr-3 text-indigo-600" />
            <span>{loading ? "Authenticating..." : "Continue as Manager"}</span>
          </button>

          {!showWorkerForm ? (
            <button
              onClick={() => setShowWorkerForm(true)}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-6 border border-gray-300 shadow-sm text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <UserCircle2 className="w-6 h-6 mr-3 text-indigo-600" />
              <span>Sign in as Worker</span>
            </button>
          ) : (
            <form onSubmit={handleWorkerLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWorkerForm(false)}
                  className="w-full mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to options
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
