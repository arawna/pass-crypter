'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { usePreferences } from "@/contexts/PreferencesContext";
import { register } from "@/lib/api-client";

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const { t } = usePreferences();
  const router = useRouter();

  const [formState, setFormState] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (formState.password !== formState.confirmPassword) {
      setError(t("errors.passwordMatch"));
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formState.name,
        email: formState.email,
        password: formState.password
      });
      setSuccess(t("auth.registerSuccess"));
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("actions.register")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("vault.createHint")}</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("auth.name")}</Label>
            <Input
              id="name"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              required
              minLength={2}
            />
          </div>
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
              autoComplete="new-password"
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formState.confirmPassword}
              onChange={(event) => setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              required
              minLength={8}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          {t("actions.register")}
        </Button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-300">
          {t("auth.switchToLogin")}{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            {t("actions.login")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
