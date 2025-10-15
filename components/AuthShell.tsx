'use client';

import { useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

type AuthShellProps = {
  children: React.ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  const { t } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-brand-50 via-white to-slate-200 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-[-10%] top-[-10%] h-96 w-96 rounded-full bg-brand-200 opacity-40 blur-3xl dark:bg-brand-600" />
        <div className="absolute bottom-[-12%] left-[-12%] h-[28rem] w-[28rem] rounded-full bg-slate-300 opacity-30 blur-3xl dark:bg-slate-700" />
      </div>
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-700 shadow-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t("appTitle")}</h1>
        </div>
        <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">{t("appSubtitle")}</p>
        <div className="hidden flex-wrap items-center gap-4 md:flex md:gap-6">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-12 md:px-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          {children}
        </div>
      </main>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 -translate-x-[110%] transform bg-white/95 p-6 shadow-xl transition-transform duration-300 ease-out dark:bg-slate-900/95 md:hidden",
          mobileMenuOpen && "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("appTitle")}</h2>
          <button
            type="button"
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sr-only">{t("actions.close")}</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{t("appSubtitle")}</p>
        <div className="mt-6 space-y-6">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
