'use client';

import { usePreferences } from "@/contexts/PreferencesContext";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = usePreferences();

  return (
    <label className="flex flex-col text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
      {t("preferences.language")}
      <select
        className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-400"
        value={locale}
        onChange={(event) => setLocale(event.target.value as "en" | "tr")}
      >
        <option value="en">English</option>
        <option value="tr">Türkçe</option>
      </select>
    </label>
  );
}
