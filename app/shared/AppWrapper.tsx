"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { LocalizationProvider } from "./localization";
import { SettingsProvider } from "./contexts/SettingsContext";
import { User } from "./types/dashboard";
import Authentication from "../ui/Authentication";
import Dashboard from "../ui/Dashboard";

const AppWrapper: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language] = useState<"en">("en");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/status/github_status");
        const data = await response.json();

        if (data.connected && data.user) {
          setUser({
            id: data.user.id.toString(),
            name: data.user.name || data.user.login,
            email: `${data.user.login}@github.local`,
            avatar: data.user.avatar_url,
            role: "viewer",
            lastLogin: new Date().toISOString(),
            permissions: ["read"],
          });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Handle successful GitHub connection from URL params
  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected === "github") {
      // Refresh auth status when GitHub connection is successful
      const recheckAuth = async () => {
        try {
          const response = await fetch("/api/status/github_status");
          const data = await response.json();

          if (data.connected && data.user) {
            const userData = {
              id: data.user.id.toString(),
              name: data.user.name || data.user.login,
              email: `${data.user.login}@github.local`,
              avatar: data.user.avatar_url,
              role: "viewer" as const,
              lastLogin: new Date().toISOString(),
              permissions: ["read"],
            };
            setUser(userData);

            // If we're on dashboard already, stay there, otherwise redirect
            if (pathname !== "/dashboard") {
              router.push("/dashboard");
            }
          }
        } catch (error) {
          console.error(
            "Error checking authentication after GitHub connection:",
            error
          );
        }
      };

      recheckAuth();
    }
  }, [searchParams, pathname, router]);

  const handleLogin = (userData: User) => {
    console.log("🚀 AppWrapper handleLogin called with:", userData);
    setUser(userData);
    console.log("✅ User state updated in AppWrapper");
    // After login, always redirect to dashboard
    console.log("🔄 Redirecting to dashboard");
    router.push("/dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    // Clear GitHub connection and redirect to home
    fetch("/api/status/github_status", { method: "DELETE" }).finally(() => {
      router.push("/");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <LocalizationProvider initialLanguage={language}>
        {pathname === "/dashboard" ? (
          // Dashboard route - require authentication
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Access Denied
                </h1>
                <p className="text-lg text-gray-700 mb-6">
                  Please log in to access the dashboard
                </p>

                {/* Demo Login Buttons */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Quick Demo Login:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        handleLogin({
                          id: "admin-1",
                          email: "admin@syncertica.com",
                          name: "John Admin",
                          role: "admin",
                          department: "IT",
                          lastLogin: new Date().toISOString(),
                          permissions: ["*"],
                        })
                      }
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      🛡️ Login as Admin
                    </button>
                    <button
                      onClick={() =>
                        handleLogin({
                          id: "manager-1",
                          email: "manager@syncertica.com",
                          name: "Mike Manager",
                          role: "manager",
                          department: "Operations",
                          lastLogin: new Date().toISOString(),
                          permissions: [
                            "dashboard:read",
                            "tasks:*",
                            "users:read",
                            "analytics:read",
                          ],
                        })
                      }
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      👔 Login as Manager
                    </button>
                    <button
                      onClick={() =>
                        handleLogin({
                          id: "employee-1",
                          email: "employee@syncertica.com",
                          name: "Jane Employee",
                          role: "employee",
                          department: "Development",
                          lastLogin: new Date().toISOString(),
                          permissions: [
                            "dashboard:read",
                            "tasks:read",
                            "tasks:write",
                          ],
                        })
                      }
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      👤 Login as Employee
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button
                    onClick={() => router.push("/")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Go to Full Login Page
                  </button>
                </div>
              </div>
            </div>
          )
        ) : // Home route - login page, but show dashboard if already authenticated
        !user ? (
          <div className="min-h-screen bg-gray-50">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  Welcome to SyncerticaEnterprise
                </h1>
                <Authentication onLogin={handleLogin} />
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome back, {user.name}!
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                You are already logged in
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </LocalizationProvider>
    </SettingsProvider>
  );
};

export default AppWrapper;
