import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { IdeaFields } from "./prompt";

let _db: Database.Database | null = null;

// Lazy singleton: the file only opens on the first real query, not at module
// import time. Next.js loads this module from several parallel build workers
// while collecting page data, and opening the same SQLite file concurrently
// at import time races on the WAL pragma (SQLITE_BUSY) — deferring the open
// to first use avoids that entirely.
function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(path.join(dataDir, "app.db"), { timeout: 5000 });
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      idea TEXT NOT NULL,
      problem TEXT NOT NULL,
      target_user TEXT NOT NULL,
      main_goal TEXT NOT NULL,
      platform TEXT NOT NULL,
      existing_features TEXT,
      competitors TEXT,
      budget TEXT,
      output TEXT NOT NULL,
      truncated INTEGER NOT NULL DEFAULT 0,
      app_name TEXT,
      recommendation TEXT
    );
  `);

  _db = db;
  return db;
}

export interface RunRecord {
  id: string;
  created_at: string;
  idea: string;
  problem: string;
  target_user: string;
  main_goal: string;
  platform: string;
  existing_features: string | null;
  competitors: string | null;
  budget: string | null;
  output: string;
  truncated: number;
  app_name: string | null;
  recommendation: string | null;
}

export interface SaveRunInput {
  fields: IdeaFields;
  output: string;
  truncated: boolean;
  appName: string;
  recommendation: string | null;
}

export function saveRun(input: SaveRunInput): string {
  const id = randomUUID();
  const insertStmt = getDb().prepare(`
    INSERT INTO runs (
      id, created_at, idea, problem, target_user, main_goal, platform,
      existing_features, competitors, budget, output, truncated, app_name, recommendation
    ) VALUES (
      @id, @created_at, @idea, @problem, @target_user, @main_goal, @platform,
      @existing_features, @competitors, @budget, @output, @truncated, @app_name, @recommendation
    )
  `);
  insertStmt.run({
    id,
    created_at: new Date().toISOString(),
    idea: input.fields.idea,
    problem: input.fields.problem,
    target_user: input.fields.user,
    main_goal: input.fields.goal,
    platform: input.fields.platform,
    existing_features: input.fields.features || null,
    competitors: input.fields.competitors || null,
    budget: input.fields.budget || null,
    output: input.output,
    truncated: input.truncated ? 1 : 0,
    app_name: input.appName,
    recommendation: input.recommendation,
  });
  return id;
}

export function listRuns(): RunRecord[] {
  return getDb().prepare("SELECT * FROM runs ORDER BY created_at DESC").all() as RunRecord[];
}

export function getRun(id: string): RunRecord | undefined {
  return getDb().prepare("SELECT * FROM runs WHERE id = ?").get(id) as
    | RunRecord
    | undefined;
}

export function deleteRun(id: string): void {
  getDb().prepare("DELETE FROM runs WHERE id = ?").run(id);
}
