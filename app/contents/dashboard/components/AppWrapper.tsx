"use client";

import React, { useState } from "react";
import { User } from "../../../shared/types/dashboard";
import Authentication from "./Authentication";
import SyncerticaEnterprise from "./SyncerticaEnterprise";

const AppWrapper: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Authentication onLogin={handleLogin} />;
  }

  return <SyncerticaEnterprise user={user} onLogout={handleLogout} />;
};

export default AppWrapper;
