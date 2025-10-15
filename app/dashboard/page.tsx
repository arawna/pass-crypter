'use client';

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { createVaultEntry, deleteVaultEntry, fetchEntries } from "@/lib/api-client";
import { decryptSecret, deriveEncryptionKey, encryptSecret } from "@/lib/crypto-client";
import type { VaultEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type FormState = {
  platform: string;
  username: string;
  password: string;
};

export default function DashboardPage() {
  const { user, token, encryptionSalt, encryptionKey, setEncryptionKey, logout, isAuthenticated, loading } = useAuth();
  const { t } = usePreferences();
  const router = useRouter();

  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(false);
  const [formState, setFormState] = useState<FormState>({ platform: "", username: "", password: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!token) {
      setEntries([]);
      return;
    }

    async function load() {
      setFetching(true);
      setFormError(null);
      try {
        const result = await fetchEntries(token);
        const ordered = [...result.entries].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEntries(ordered);
      } catch (error) {
        console.error(error);
        setFormError(t("errors.generic"));
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [token, t]);

  useEffect(() => {
    if (!encryptionKey) {
      setPasswords({});
      return;
    }

    let cancelled = false;
    async function decryptAll() {
      try {
        const decryptedPairs = await Promise.all(
          entries.map(async (entry) => {
            const password = await decryptSecret(encryptionKey, entry.ciphertext, entry.iv);
            return { id: entry.id, password };
          })
        );
        if (!cancelled) {
          const next: Record<string, string> = {};
          decryptedPairs.forEach((item) => {
            next[item.id] = item.password;
          });
          setPasswords(next);
          setUnlockError(null);
        }
      } catch (error) {
        console.error("Decrypt error", error);
        if (!cancelled) {
          setUnlockError(t("auth.invalidCredentials"));
          setEncryptionKey(null);
        }
      }
    }
    if (entries.length > 0) {
      void decryptAll();
    }
  }, [entries, encryptionKey, setEncryptionKey, t]);

  const showUnlockPrompt = useMemo(
    () => Boolean(isAuthenticated && encryptionSalt && !encryptionKey),
    [isAuthenticated, encryptionSalt, encryptionKey]
  );

  const confirmEntry = useMemo(
    () => entries.find((entry) => entry.id === confirmId) ?? null,
    [entries, confirmId]
  );

  const handleAddEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setFormError(t("errors.generic"));
      return;
    }
    if (!encryptionKey) {
      setFormError(t("vault.decryptPrompt"));
      return;
    }

    setAdding(true);
    setFormError(null);
    setInfoMessage(null);
    try {
      const { ciphertext, iv } = await encryptSecret(encryptionKey, formState.password);
      const response = await createVaultEntry(token, {
        platform: formState.platform,
        username: formState.username,
        ciphertext,
        iv
      });
      setEntries((prev) => [response.entry, ...prev]);
      setPasswords((prev) => ({
        ...prev,
        [response.entry.id]: formState.password
      }));
      setFormState({ platform: "", username: "", password: "" });
      setInfoMessage(t("vault.added"));
    } catch (error) {
      console.error(error);
      setFormError(t("errors.generic"));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) {
      setFormError(t("errors.generic"));
      return;
    }
    setDeletingId(id);
    setFormError(null);
    setInfoMessage(null);
    try {
      await deleteVaultEntry(token, id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      setPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setInfoMessage(t("vault.removed"));
      setConfirmId(null);
    } catch (error) {
      console.error(error);
      setFormError(t("errors.generic"));
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) {
      return;
    }
    await handleDelete(confirmId);
  };

  const handleCopy = async (id: string) => {
    const secret = passwords[id];
    if (!secret) {
      return;
    }
    try {
      await navigator.clipboard.writeText(secret);
      setInfoMessage(t("vault.copied"));
    } catch (error) {
      console.error(error);
      setFormError(t("errors.generic"));
    }
  };

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!encryptionSalt) {
      return;
    }
    setUnlockError(null);
    setUnlockLoading(true);
    try {
      const key = await deriveEncryptionKey(unlockPassword, encryptionSalt);
      if (entries.length > 0) {
        await Promise.all(entries.map((entry) => decryptSecret(key, entry.ciphertext, entry.iv)));
      }
      setEncryptionKey(key);
      setUnlockError(null);
      setUnlockPassword("");
    } catch (error) {
      console.error(error);
      setUnlockError(t("auth.invalidCredentials"));
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    router.push("/login");
  };

  const masked = (value?: string) => value?.replace(/./g, "•") ?? "";
  const truncated = (value?: string, max = 20) => {
    if (!value) {
      return "";
    }
    return value.length > max ? `${value.slice(0, max)}...` : value;
  };

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-50 via-white to-slate-200 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-800",
        mobileMenuOpen && "overflow-hidden"
      )}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-[-10%] top-[-10%] h-96 w-96 rounded-full bg-brand-200 opacity-40 blur-3xl dark:bg-brand-600" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-slate-300 opacity-30 blur-3xl dark:bg-slate-700" />
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 md:px-12">
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
        <div className="hidden items-center gap-6 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur dark:bg-slate-800/70 dark:text-slate-100">
            <span>{user?.name}</span>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              className="text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
              onClick={handleLogout}
            >
              {t("actions.logout")}
            </button>
          </div>
        </div>
      </header>

      <main className={cn("relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 md:px-12")}>
        <section className="grid gap-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-soft backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80 md:p-8 lg:grid-cols-[minmax(280px,360px),1fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t("actions.addCredential")}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t("vault.createHint")}</p>
            <form className="space-y-4" onSubmit={handleAddEntry}>
              <div>
                <Label htmlFor="platform">{t("vault.platform")}</Label>
                <Input
                  id="platform"
                  value={formState.platform}
                  onChange={(event) => setFormState((prev) => ({ ...prev, platform: event.target.value }))}
                  required
                  placeholder="Example App"
                />
              </div>
              <div>
                <Label htmlFor="username">{t("vault.username")}</Label>
                <Input
                  id="username"
                  value={formState.username}
                  onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
                  required
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">{t("vault.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formState.password}
                  onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  minLength={4}
                />
              </div>
              <Button type="submit" className="w-full" loading={adding}>
                {t("actions.save")}
              </Button>
            </form>
          </div>

          <div className="relative rounded-2xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-950/60">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("appTitle")}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t("vault.decryptPrompt")}</p>
            </div>
            <div className="mt-6 space-y-4">
              {infoMessage && <div className="rounded-lg bg-emerald-100 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">{infoMessage}</div>}
              {formError && <div className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600 dark:bg-red-900/60 dark:text-red-300">{formError}</div>}
              {fetching ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
              ) : entries.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("vault.empty")}</p>
              ) : (
                <ul className="space-y-4">
                  {entries.map((entry) => {
                    const decrypted = passwords[entry.id];
                    return (
                      <li
                        key={entry.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200/60 bg-white/70 px-4 py-4 transition-colors hover:border-brand-200 hover:bg-white dark:border-slate-800/60 dark:bg-slate-900/60 dark:hover:border-brand-500/40 dark:hover:bg-slate-900"
                      >
                        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.platform}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-300">{entry.username}</p>
                          </div>
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center md:flex-nowrap">
                            {decrypted ? (
                              <code
                                className="block truncate rounded-lg bg-slate-200 px-3 py-1 text-sm font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50 sm:flex-1 sm:min-w-[160px] md:flex-none md:max-w-xs lg:max-w-sm"
                                title={decrypted}
                              >
                                {truncated(decrypted)}
                              </code>
                            ) : (
                              <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                {masked("********")}
                              </span>
                            )}
                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                              {decrypted && (
                                <Button variant="ghost" type="button" onClick={() => handleCopy(entry.id)}>
                                  {t("actions.copy")}
                                </Button>
                              )}
                              <Button variant="ghost" type="button" onClick={() => setConfirmId(entry.id)}>
                                {t("actions.delete")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>

      {confirmId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{t("vault.confirmDeleteTitle")}</h3>
            <p className="text-sm text-slate-300">{t("vault.confirmDeleteMessage")}</p>
            {confirmEntry && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200">
                <p className="font-medium">{confirmEntry.platform}</p>
                <p className="text-slate-400">{confirmEntry.username}</p>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => setConfirmId(null)}
                disabled={deletingId === confirmId}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-500 focus-visible:ring-red-400"
                loading={deletingId === confirmId}
                onClick={confirmDelete}
              >
                {t("actions.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

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
        <div className="mt-6 space-y-6">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
            <p className="font-medium">{user?.name}</p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
              onClick={handleLogout}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3 3-3 3m3-3H9" />
              </svg>
              {t("actions.logout")}
            </button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {showUnlockPrompt && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <form
            className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl"
            onSubmit={handleUnlock}
          >
            <h3 className="text-lg font-semibold text-white">{t("vault.unlockTitle")}</h3>
            <p className="text-sm text-slate-300">{t("vault.unlockHelp")}</p>
            <div>
              <Label htmlFor="unlock-password" className="text-slate-300">
                {t("auth.password")}
              </Label>
              <Input
                id="unlock-password"
                type="password"
                value={unlockPassword}
                onChange={(event) => setUnlockPassword(event.target.value)}
                required
                minLength={8}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            {unlockError && <p className="text-sm text-red-400">{unlockError}</p>}
            <Button type="submit" className="w-full" loading={unlockLoading}>
              {t("actions.unlock")}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
