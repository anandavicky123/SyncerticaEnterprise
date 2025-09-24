"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SettingsModal from "./SettingsModal";
import ProfileModal from "./ProfileModal";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { User as UserType } from "../shared/types/dashboard";
import Tooltip from "./Tooltip";

interface ProfileDropdownProps {
  user: UserType;
  // keep onLogout prop for backward compatibility but make it optional
  onLogout?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [managerEmail, setManagerEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchManagerData = async () => {
    try {
      const res = await fetch("/api/manager/profile");
      if (res.ok) {
        const data = await res.json();
        setManagerName(data.name || null);
        setManagerEmail(data.email || null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Fetch manager profile info for profile modal
    fetchManagerData();
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getRoleColor = (role: string = "") => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-yellow-100 text-yellow-800";
      case "employee":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  // Localization removed; inline English strings from locales/en.json

  const t_profile = "Profile";
  const t_settings = "Settings";
  const t_logout = "Logout";

  // Safely compute role label (user.role may be undefined)
  const roleValue = user.role ?? "";
  const roleLabel =
    roleValue.length > 0
      ? roleValue.charAt(0).toUpperCase() + roleValue.slice(1)
      : "";

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip content={t_profile + " menu"}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-0"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block text-left min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name}
            </div>
            <div
              className={`text-xs px-2 py-0.5 rounded inline-block ${getRoleColor(
                user.role,
              )}`}
            >
              {roleLabel}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {user.email}
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded mt-1 inline-block ${getRoleColor(
                    user.role,
                  )}`}
                >
                  {roleLabel} - {user.department}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              onClick={() => setProfileOpen(true)}
            >
              <User className="w-4 h-4" />
              <span>{t_profile}</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
              <span>{t_settings}</span>
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // Prefer client-side navigation to the login page. If a logout handler
                // was provided (for clearing auth state), call it, but still navigate.
                try {
                  if (onLogout) onLogout();
                } catch {
                  // ignore handler errors
                }
                router.push("/login");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t_logout}</span>
            </button>
          </div>
        </div>
      )}
      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        initialName={managerName}
        initialEmail={managerEmail}
        onSaveSuccess={fetchManagerData}
      />
    </div>
  );
};

export default ProfileDropdown;
