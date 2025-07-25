"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Shield,
  User,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";
import { User as UserType } from "../../../shared/types/dashboard";

interface AuthenticationProps {
  onLogin?: (user: UserType) => void;
  className?: string;
}

const Authentication: React.FC<AuthenticationProps> = ({
  onLogin,
  className = "",
}) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock users for demo purposes
  const mockUsers: UserType[] = [
    {
      id: "admin-1",
      email: "admin@syncertica.com",
      name: "John Admin",
      role: "admin",
      department: "IT",
      lastLogin: new Date().toISOString(),
      cognitoId: "cognito-admin-123",
      permissions: ["*"],
    },
    {
      id: "employee-1",
      email: "employee@syncertica.com",
      name: "Jane Employee",
      role: "employee",
      department: "Development",
      lastLogin: new Date().toISOString(),
      cognitoId: "cognito-emp-456",
      permissions: ["dashboard:read", "tasks:read", "tasks:write"],
    },
    {
      id: "manager-1",
      email: "manager@syncertica.com",
      name: "Mike Manager",
      role: "manager",
      department: "Operations",
      lastLogin: new Date().toISOString(),
      cognitoId: "cognito-mgr-789",
      permissions: [
        "dashboard:read",
        "tasks:*",
        "users:read",
        "analytics:read",
      ],
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate AWS Cognito authentication
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (isSignIn) {
        // Mock sign in
        const user = mockUsers.find((u) => u.email === formData.email);
        if (user && formData.password === "demo123") {
          console.log("🔐 AWS Cognito Authentication Successful");
          console.log("🎫 JWT Token Generated (Mock)");
          console.log("👤 User Role:", user.role);
          console.log("🛡️ Permissions:", user.permissions);
          onLogin?.(user);
        } else {
          setError("Invalid email or password");
        }
      } else {
        // Mock sign up
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        const newUser: UserType = {
          id: `user-${Date.now()}`,
          email: formData.email,
          name: formData.name,
          role: "employee",
          department: "General",
          lastLogin: new Date().toISOString(),
          cognitoId: `cognito-${Date.now()}`,
          permissions: ["dashboard:read", "tasks:read"],
        };

        console.log("📝 AWS Cognito User Registration");
        console.log("✉️ Verification Email Sent (Mock)");
        onLogin?.(newUser);
      }
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: "admin" | "employee" | "manager") => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      console.log(`🚀 Demo Login as ${role.toUpperCase()}`);
      onLogin?.(user);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-6 ${className}`}
    >
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Syncertica Enterprise
          </h1>
          <p className="text-blue-200">Secure AWS Cognito Authentication</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setIsSignIn(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isSignIn ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignIn(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isSignIn ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                    required={!isSignIn}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {!isSignIn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your password"
                    required={!isSignIn}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignIn ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {isSignIn && (
            <div className="mt-6">
              <div className="text-center text-sm text-gray-600 mb-4">
                Demo Accounts - Password:{" "}
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  demo123
                </span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleDemoLogin("admin")}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Admin</div>
                      <div className="text-sm text-gray-500">
                        admin@syncertica.com
                      </div>
                    </div>
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Full Access
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDemoLogin("manager")}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Manager</div>
                      <div className="text-sm text-gray-500">
                        manager@syncertica.com
                      </div>
                    </div>
                    <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Limited Admin
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDemoLogin("employee")}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Employee</div>
                      <div className="text-sm text-gray-500">
                        employee@syncertica.com
                      </div>
                    </div>
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Read Only
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-500">
            🔐 Secured by AWS Cognito • 🛡️ Enterprise SSO Ready
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authentication;
