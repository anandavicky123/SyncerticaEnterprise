"use client";

import React, { useState } from "react";
import { LocalizationProvider } from "./localization";
import { User } from "./types/dashboard";
import Authentication from "../ui/Authentication";
import SyncerticaEnterprise from "../ui/SyncerticaEnterprise";

const AppWrapper: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // You can later connect this to global settings
  const [language] = useState<"en">("en");

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <LocalizationProvider initialLanguage={language}>
      {!user ? (
        <Authentication onLogin={handleLogin} />
      ) : (
        <SyncerticaEnterprise user={user} onLogout={handleLogout} />
      )}
    </LocalizationProvider>
  );
};

export default AppWrapper;
