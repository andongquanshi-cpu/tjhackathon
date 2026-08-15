import fs from "node:fs";
import path from "node:path";
import { buildSeedData } from "./seed";
import type { DB, Note, Profile } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function emptyDB(): DB {
  return { version: 1, profile: null, notes: [] };
}

/** 演示模式下首次运行自动写入种子数据，开箱即有内容 */
function ensureSeeded(): void {
  if (fs.existsSync(DB_FILE)) return;
  if (process.env.DEMO_MODE === "0") {
    writeDB(emptyDB());
    return;
  }
  const { notes, profile } = buildSeedData();
  writeDB({ version: 1, profile, notes });
}

function readDB(): DB {
  ensureSeeded();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw) as Partial<DB>;
    return { ...emptyDB(), ...db };
  } catch (err) {
    console.error("[store] failed to read db, using empty", err);
    return emptyDB();
  }
}

function writeDB(db: DB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// ---- Profile ----
export function getProfile(): Profile | null {
  return readDB().profile;
}

export function setProfile(profile: Profile): void {
  const db = readDB();
  db.profile = profile;
  writeDB(db);
}

export function updateProfile(patch: Partial<Profile>): Profile | null {
  const db = readDB();
  if (!db.profile) return null;
  db.profile = { ...db.profile, ...patch, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.profile;
}

// ---- Notes ----
export function getNotes(): Note[] {
  return readDB().notes;
}

export function getNote(id: string): Note | null {
  return readDB().notes.find((n) => n.id === id) ?? null;
}

export function addNote(note: Note): Note {
  const db = readDB();
  db.notes.push(note);
  writeDB(db);
  return note;
}

export function updateNote(id: string, patch: Partial<Note>): Note | null {
  const db = readDB();
  const idx = db.notes.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  db.notes[idx] = { ...db.notes[idx], ...patch };
  writeDB(db);
  return db.notes[idx];
}

// ---- Reset / seed ----
export function resetDB(): void {
  writeDB(emptyDB());
}

export function seedDB(notes: Note[], profile: Profile | null): void {
  writeDB({ version: 1, profile, notes });
}

/** 当前训练营第几天（1-21），以初始测评为起点 */
export function currentDay(profile: Profile | null): number {
  if (!profile) return 1;
  const start = new Date(profile.createdAt).getTime();
  const days = Math.floor((Date.now() - start) / 86_400_000) + 1;
  return Math.max(1, Math.min(21, days));
}