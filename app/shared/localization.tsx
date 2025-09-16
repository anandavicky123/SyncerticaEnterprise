import React, { createContext, useContext, useState, ReactNode } from "react";
import en from "./locales/en.json";
import id from "./locales/id.json";
import ja from "./locales/ja.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";
import ko from "./locales/ko.json";
import zhHant from "./locales/zh-Hant.json";
import zhHans from "./locales/zh-Hans.json";
import ar from "./locales/ar.json";
import it from "./locales/it.json";
import de from "./locales/de.json";
import ru from "./locales/ru.json";

export type Locale =
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
  | "ru";

export interface LocalizationContextProps {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextProps | undefined>(
  undefined
);

type NestedString = string | Record<string, string>;

const localeFiles: Record<Locale, Record<string, NestedString>> = {
  en,
  id,
  ja,
  es,
  fr,
  pt,
  ko,
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
  ar,
  it,
  de,
  ru,
};

export const LocalizationProvider = ({
  children,
  initialLanguage = "en",
}: {
  children: ReactNode;
  initialLanguage?: Locale;
}) => {
  const [language, setLanguage] = useState<Locale>(initialLanguage);
  const t = (key: string): string => {
    const value = localeFiles[language][key];
    if (typeof value === "string") {
      return value;
    }
    return key; // Return key if not found or not a string
  };
  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context)
    throw new Error("useLocalization must be used within LocalizationProvider");
  return context;
};
