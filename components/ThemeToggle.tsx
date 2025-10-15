'use client';

import { useEffect, useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: Array<{ value: "light" | "dark" | "system"; icon: string }> = [
  { value: "light", icon: "🌞" },
  { value: "dark", icon: "🌙" },
  { value: "system", icon: "💻" }
];

export default function ThemeToggle() {
  const { theme, setTheme, t } = usePreferences();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="space-y-3">
      <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{t("preferences.theme")}</span>
      <div className="grid grid-cols-3 gap-2 sm:inline-flex sm:rounded-full sm:bg-slate-200 sm:p-1 sm:text-xs dark:sm:bg-slate-800">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:rounded-full sm:px-3 sm:py-1",
              hydrated && theme === option.value
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            )}
            onClick={() => setTheme(option.value)}
          >
            <span>{option.icon}</span>
            <span>{t(`preferences.${option.value}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
