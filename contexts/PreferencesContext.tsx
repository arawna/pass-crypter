'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en.json";
import tr from "@/locales/tr.json";

type ThemePreference = "light" | "dark" | "system";
type LocalePreference = "en" | "tr";

type Messages = typeof en;

const translations: Record<LocalePreference, Messages> = {
  en,
  tr
};

type PreferencesContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  locale: LocalePreference;
  setLocale: (locale: LocalePreference) => void;
  t: (key: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

function translate(locale: LocalePreference, key: string): string {
  const segments = key.split(".");
  let current: any = translations[locale];

  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return key;
    }
  }

  if (typeof current === "string") {
    return current;
  }

  return key;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = theme;
}

function applyLocale(locale: LocalePreference) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.lang = locale;
  document.documentElement.dataset.localePreference = locale;
}

type PreferencesProviderProps = {
  children: React.ReactNode;
  initialTheme: "light" | "dark";
  initialLocale: LocalePreference;
};

export function PreferencesProvider({ children, initialTheme, initialLocale }: PreferencesProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof document !== "undefined") {
      const stored = document.documentElement.dataset.themePreference as ThemePreference | undefined;
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    }
    return initialTheme;
  });
  const [locale, setLocaleState] = useState<LocalePreference>(initialLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("user-theme") as ThemePreference | null;
      const storedLocale = localStorage.getItem("user-locale") as LocalePreference | null;

      const themeToApply = storedTheme ?? initialTheme;
      setThemeState(themeToApply);
      applyTheme(themeToApply);

      const localeToApply = storedLocale ?? initialLocale;
      setLocaleState(localeToApply);
      applyLocale(localeToApply);
    } catch (error) {
      console.warn("Failed to hydrate preferences from storage", error);
      applyTheme(initialTheme);
      applyLocale(initialLocale);
    }
    setHydrated(true);
  }, [initialTheme, initialLocale]);

  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
    return undefined;
  }, [theme]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    applyTheme(theme);
    try {
      localStorage.setItem("user-theme", theme);
    } catch (error) {
      console.warn("Unable to persist theme", error);
    }
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    applyLocale(locale);
    try {
      localStorage.setItem("user-locale", locale);
    } catch (error) {
      console.warn("Unable to persist locale", error);
    }
  }, [locale, hydrated]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
  };

  const setLocale = (next: LocalePreference) => {
    setLocaleState(next);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      locale,
      setLocale,
      t: (key: string) => translate(locale, key)
    }),
    [theme, locale]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
