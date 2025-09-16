"use client";

import React from "react";
import { LocalizationProvider } from "./localization";
import { SettingsProvider } from "./contexts/SettingsContext";
import Dashboard from "../ui/Dashboard";

export default function AppWrapper() {
  return (
    <LocalizationProvider>
      <SettingsProvider>
        <Dashboard
          user={{
            id: "demo-user",
            name: "Demo User",
            email: "demo@syncertica.com",
            avatar: "",
            role: "viewer",
            lastLogin: new Date().toISOString(),
            permissions: ["read"],
          }}
        />
      </SettingsProvider>
    </LocalizationProvider>
  );
}
