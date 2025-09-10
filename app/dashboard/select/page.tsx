"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

export default function DashboardSelectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleManagerAccess = async () => {
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
          name: "Manager", // Default name, can be changed in settings
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create manager session");
      }

      // Set session cookie
      document.cookie = `session-id=${data.sessionId}; path=/; max-age=${
        24 * 60 * 60
      }; ${
        process.env.NODE_ENV === "development" ? "" : "secure; "
      }samesite=lax`;

      // Clear any existing error state
      setError("");

      // Redirect to manager dashboard
      router.push("/dashboard");
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

  const handleWorkerAccess = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Syncertica Enterprise
          </h1>
          <p className="text-gray-600">Choose your access type to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Manager Access */}
          <button
            onClick={handleManagerAccess}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>{loading ? "Accessing..." : "Manager Dashboard"}</span>
          </button>

          {/* Worker Access */}
          <button
            onClick={handleWorkerAccess}
            disabled={loading}
            className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <svg
              className="w-6 h-6"
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
            <span>Worker Login</span>
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            <strong>Manager:</strong> Full access to manage workers, projects,
            and tasks
          </p>
          <p className="mt-1">
            <strong>Worker:</strong> Access to assigned tasks and project
            updates
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
