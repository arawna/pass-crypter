import "./globals.css";

import { headers } from "next/headers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SUPPORTED_LOCALES = ["en", "tr"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const preferenceInitializer = `
(function() {
  try {
    const storedTheme = localStorage.getItem("user-theme");
    const storedLocale = localStorage.getItem("user-locale");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const fallbackTheme = systemPrefersDark ? "dark" : "light";
    const themePreference = storedTheme || document.documentElement.dataset.themePreference || fallbackTheme;
    const resolvedTheme = themePreference === "system" ? (systemPrefersDark ? "dark" : "light") : themePreference;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = themePreference;
    const localePreference =
      storedLocale || document.documentElement.dataset.localePreference || document.documentElement.lang || "en";
    document.documentElement.lang = localePreference;
    document.documentElement.dataset.localePreference = localePreference;
  } catch (error) {
    console.warn("Failed to initialize preferences", error);
  }
})();`;

export const metadata: Metadata = {
  title: "CipherSafe",
  description:
    "Securely store and encrypt your platform credentials using your own master password. Supports Turkish and English with light/dark themes."
};

function resolveInitialLocale(acceptLanguage?: string | null): SupportedLocale {
  if (!acceptLanguage) {
    return "en";
  }

  const [primary] = acceptLanguage.split(",");
  const normalized = primary?.trim().split("-")[0]?.toLowerCase();
  if (normalized && SUPPORTED_LOCALES.includes(normalized as SupportedLocale)) {
    return normalized as SupportedLocale;
  }
  return "en";
}

function resolveInitialTheme(prefersColorScheme?: string | null): "light" | "dark" {
  if (!prefersColorScheme) {
    return "light";
  }
  if (prefersColorScheme === "dark") {
    return "dark";
  }
  return "light";
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = headers();
  const acceptLanguage = headerList.get("accept-language");
  const prefersColorScheme = headerList.get("sec-ch-prefers-color-scheme");

  const initialLocale = resolveInitialLocale(acceptLanguage);
  const initialTheme = resolveInitialTheme(prefersColorScheme);

  return (
    <html
      lang={initialLocale}
      data-theme-preference={initialTheme}
      data-locale-preference={initialLocale}
      data-theme={initialTheme}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceInitializer }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors duration-300 ease-out dark:bg-slate-950 dark:text-slate-100">
        <Providers initialLocale={initialLocale} initialTheme={initialTheme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
