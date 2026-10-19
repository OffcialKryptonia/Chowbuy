import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let token: string | null = null;
export async function loadToken() {
  try { token = await SecureStore.getItemAsync('cb_token'); } catch { token = null; }
  return token;
}
export async function setToken(t: string | null) {
  token = t;
  try { t ? await SecureStore.setItemAsync('cb_token', t) : await SecureStore.deleteItemAsync('cb_token'); } catch { /* secure store unavailable */ }
}

interface Opts { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; signal?: AbortSignal }

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) {
    let msg = 'Something went wrong. Please try again.';
    try { const j = await res.json(); if (j?.message) msg = j.message; } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}
