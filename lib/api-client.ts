'use client';

import type { VaultEntry } from "@/lib/types";

type FetchOptions = RequestInit & {
  token?: string | null;
};

async function request<TResponse>(url: string, options: FetchOptions = {}): Promise<TResponse> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data as TResponse;
}

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export function register(payload: RegisterPayload) {
  return request<{ user: { id: string; email: string; name: string } }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type LoginPayload = {
  email: string;
  password: string;
};

export function login(payload: LoginPayload) {
  return request<{
    token: string;
    user: { id: string; email: string; name: string };
    encryptionSalt: string;
    expiresAt: string;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type VaultEntryPayload = {
  platform: string;
  username: string;
  ciphertext: string;
  iv: string;
};

export function fetchEntries(token: string) {
  return request<{ entries: VaultEntry[] }>("/api/entries", {
    method: "GET",
    token
  });
}

export function createVaultEntry(token: string, payload: VaultEntryPayload) {
  return request<{ entry: VaultEntry }>("/api/entries", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export function deleteVaultEntry(token: string, id: string) {
  return request<{ success: boolean }>(`/api/entries/${id}`, {
    method: "DELETE",
    token
  });
}
