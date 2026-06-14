/**
 * Simple file-based store used when Supabase is not yet configured.
 * Data is persisted to /data/*.json in the project root.
 * This is intentionally only imported server-side (API routes).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Concert, Registration } from "./database.types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONCERTS_FILE = path.join(DATA_DIR, "concerts.json");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown) {
  ensureDir();
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// ── Concerts ──────────────────────────────────────────────────────────────────

export function localGetConcerts(activeOnly = false): Concert[] {
  const all = readJSON<Concert[]>(CONCERTS_FILE, []);
  return activeOnly ? all.filter((c) => c.is_active) : all;
}

export function localGetConcert(id: string): Concert | null {
  return localGetConcerts().find((c) => c.id === id) ?? null;
}

export function localInsertConcert(data: Omit<Concert, "id" | "created_at">): Concert {
  const concerts = localGetConcerts();
  const concert: Concert = {
    ...data,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  concerts.push(concert);
  writeJSON(CONCERTS_FILE, concerts);
  return concert;
}

export function localUpdateConcert(id: string, data: Partial<Concert>): Concert | null {
  const concerts = localGetConcerts();
  const idx = concerts.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  concerts[idx] = { ...concerts[idx], ...data };
  writeJSON(CONCERTS_FILE, concerts);
  return concerts[idx];
}

export function localDeleteConcert(id: string) {
  writeJSON(CONCERTS_FILE, localGetConcerts().filter((c) => c.id !== id));
}

// ── Registrations ─────────────────────────────────────────────────────────────

export function localGetRegistrations(concertId?: string): Registration[] {
  const all = readJSON<Registration[]>(REGISTRATIONS_FILE, []);
  return concertId ? all.filter((r) => r.concert_id === concertId) : all;
}

export function localGetRegistration(id: string): Registration | null {
  return localGetRegistrations().find((r) => r.id === id) ?? null;
}

export function localInsertRegistration(
  data: Omit<Registration, "id" | "checked_in" | "checked_in_at" | "created_at">
): Registration {
  const regs = localGetRegistrations();
  const reg: Registration = {
    ...data,
    id: randomUUID(),
    checked_in: false,
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };
  regs.push(reg);
  writeJSON(REGISTRATIONS_FILE, regs);
  return reg;
}

export function localCheckIn(id: string): Registration | null {
  const all = localGetRegistrations();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], checked_in: true, checked_in_at: new Date().toISOString() };
  writeJSON(REGISTRATIONS_FILE, all);
  return all[idx];
}

export function localUncheckIn(id: string): Registration | null {
  const all = localGetRegistrations();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], checked_in: false, checked_in_at: null };
  writeJSON(REGISTRATIONS_FILE, all);
  return all[idx];
}

// ── Stats helper (mirrors what the Supabase admin route computes) ─────────────

export function localGetStats(concertId: string) {
  const regs = localGetRegistrations(concertId);
  const confirmed = regs.filter((r) => !r.on_waitlist);
  return {
    totalSpots: confirmed.reduce((s, r) => s + r.spots, 0),
    registrations: confirmed.length,
    checkedIn: confirmed.filter((r) => r.checked_in).length,
    waitlist: regs.filter((r) => r.on_waitlist).length,
  };
}
