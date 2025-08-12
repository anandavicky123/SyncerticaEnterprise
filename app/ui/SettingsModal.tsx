import React, { useState, useEffect } from "react";
import { useLocalization } from "../shared/localization";
import { useSettings } from "../shared/contexts/SettingsContext";

const dateFormats = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY/MM/DD", label: "YYYY/MM/DD" },
];

const timeFormats = [
  { value: "12", label: "12 Hour" },
  { value: "24", label: "24 Hour" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "id", label: "Indonesian" },
  { value: "ja", label: "Japanese" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "pt", label: "Portuguese" },
  { value: "ko", label: "Korean" },
  { value: "zh-Hant", label: "Chinese (Traditional)" },
  { value: "zh-Hans", label: "Chinese (Simplified)" },
  { value: "ar", label: "Modern Standard Arabic" },
  { value: "it", label: "Italian" },
  { value: "de", label: "German" },
  { value: "ru", label: "Russian" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [timeFormat, setTimeFormat] = useState(settings.timeFormat);
  const [language, setLanguage] = useState(settings.language);
  const { t, setLanguage: setGlobalLanguage } = useLocalization();

  useEffect(() => {
    setDateFormat(settings.dateFormat);
    setTimeFormat(settings.timeFormat);
    setLanguage(settings.language);
  }, [settings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {t("settings")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              {t("dateFormat")}
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {dateFormats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              {t("timeFormat")}
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {timeFormats.map((f) => (
                <option key={f.value} value={f.value}>
                  {t(f.value === "12" ? "12hour" : "24hour")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              {t("language")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() => {
              setGlobalLanguage(
                language as
                  | "en"
                  | "id"
                  | "ja"
                  | "es"
                  | "fr"
                  | "pt"
                  | "ko"
                  | "zh-Hant"
                  | "zh-Hans"
                  | "ar"
                  | "it"
                  | "de"
                  | "ru"
              );
              updateSettings({ dateFormat, timeFormat, language });
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
