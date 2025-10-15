'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { login } from "@/lib/api-client";
import { deriveEncryptionKey } from "@/lib/crypto-client";

type LoginFormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { login: setSession, setEncryptionKey } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();

  const [formState, setFormState] = useState<LoginFormState>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await login({
        email: formState.email,
        password: formState.password
      });

      setSession({
        token: response.token,
        user: response.user,
        encryptionSalt: response.encryptionSalt
      });

      const key = await deriveEncryptionKey(formState.password, response.encryptionSalt);
      setEncryptionKey(key);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError(t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("actions.login")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("vault.createHint")}</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              required
              minLength={8}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          {t("actions.login")}
        </Button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-300">
          {t("auth.switchToRegister")}{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            {t("actions.register")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
