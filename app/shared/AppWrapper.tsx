"use client";

import React, { useEffect, useState } from "react";
import { SettingsProvider } from "./contexts/SettingsContext";
import Dashboard from "../ui/Dashboard";

export default function AppWrapper() {
  const [name, setName] = useState<string>("Loading...");
  const [email, setEmail] = useState<string>("demo@syncertica.com");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/manager/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        // Use explicit key checks so we accept empty strings or nulls from the API
        if (Object.prototype.hasOwnProperty.call(data, "name")) {
          setName(data.name ?? "");
        }
        if (Object.prototype.hasOwnProperty.call(data, "email")) {
          setEmail(data.email ?? "");
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SettingsProvider>
      <Dashboard
        user={{
          id: "demo-user",
          name,
          email,
          avatar: "",
          role: "manager",
          lastLogin: new Date().toISOString(),
          permissions: ["read"],
        }}
      />
    </SettingsProvider>
  );
}
