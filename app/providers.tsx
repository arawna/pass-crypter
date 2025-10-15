'use client';

import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";

type ProvidersProps = {
  children: React.ReactNode;
  initialLocale: "en" | "tr";
  initialTheme: "light" | "dark";
};

export default function Providers({ children, initialLocale, initialTheme }: ProvidersProps) {
  return (
    <PreferencesProvider initialLocale={initialLocale} initialTheme={initialTheme}>
      <AuthProvider>{children}</AuthProvider>
    </PreferencesProvider>
  );
}
