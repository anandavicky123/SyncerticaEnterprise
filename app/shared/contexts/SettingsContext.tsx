import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface UserSettings {
  dateFormat: string;
  timeFormat: string;
  language: string;
}

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  formatDate: (date: Date) => string;
  formatTime: (time: string) => string;
}

const defaultSettings: UserSettings = {
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12",
  language: "en",
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try to fetch from server (manager settings)
        const res = await fetch("/api/manager/settings", {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setSettings((prev) => ({ ...prev, ...data }));
          setError(null);
          return;
        } else {
          throw new Error(`Failed to load settings: ${res.statusText}`);
        }
      } catch (err) {
        setError((err as Error)?.message || "Failed to load settings");
        // ignore and fall back to localStorage
        const savedSettings = localStorage.getItem("userSettings");
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            setSettings({ ...defaultSettings, ...parsed });
          } catch (error) {
            console.error("Failed to parse saved settings:", error);
            setError("Failed to parse saved settings");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Persist settings to server when they change (debounced could be added)
  useEffect(() => {
    const save = async () => {
      try {
        await fetch("/api/manager/settings", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
  } catch {
        // fallback to localStorage
        localStorage.setItem("userSettings", JSON.stringify(settings));
      }
    };
    save();
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
  setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    switch (settings.dateFormat) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "YYYY/MM/DD":
        return `${year}/${month}/${day}`;
      case "MM/DD/YYYY":
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatTime = (time24: string): string => {
    if (settings.timeFormat === "12") {
      const [hours, minutes] = time24.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return time24;
  };

  return (
    <SettingsContext.Provider
      value={{ settings, isLoading, error, updateSettings, formatDate, formatTime }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
