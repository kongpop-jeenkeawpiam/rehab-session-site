import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const schemaPath = new URL("../supabase-schema.sql", import.meta.url);

assert.match(
  html,
  /cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/,
  "page should load the Supabase browser client"
);

assert.match(
  html,
  /id="sync-auth-panel"/,
  "page should include a cloud sync auth panel"
);

["sync-email", "sync-password", "sync-sign-in", "sync-sign-up", "sync-sign-out", "sync-status"].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `auth panel should include ${id}`);
});

assert.match(
  script,
  /const SUPABASE_TABLE = "rehab_sessions"/,
  "script should target the rehab_sessions table"
);

assert.match(
  script,
  /signInWithPassword/,
  "script should sign in with Supabase email and password auth"
);

assert.match(
  script,
  /upsert\(/,
  "script should upsert progress changes to Supabase"
);

assert.equal(existsSync(schemaPath), true, "Supabase schema file should exist");

const schema = readFileSync(schemaPath, "utf8");

assert.match(schema, /create table if not exists public\.rehab_sessions/i);
assert.match(schema, /enable row level security/i);
assert.match(schema, /auth\.uid\(\) = user_id/i);
