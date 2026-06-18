import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");
const schemaPath = new URL("../supabase-schema.sql", import.meta.url);

const getFunctionBody = (name) => {
  const match = script.match(new RegExp(`const\\s+${name}\\s*=\\s*async\\s*\\(\\)\\s*=>\\s*\\{([\\s\\S]*?)\\n\\};`));
  assert.ok(match, `script should define ${name}`);
  return match[1];
};

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
  /const SUPABASE_PROFILE_TABLE = "rehab_profiles"/,
  "script should target the rehab_profiles table for profile sync"
);

assert.match(
  script,
  /const saveSupabaseProfile = async \(\)/,
  "script should save user-level profile state to Supabase"
);

assert.match(
  script,
  /const loadSupabaseProfile = async \(\)/,
  "script should load user-level profile state from Supabase"
);

const saveSupabaseProfileBody = getFunctionBody("saveSupabaseProfile");
const loadSupabaseProfileBody = getFunctionBody("loadSupabaseProfile");

assert.match(
  script,
  /const\s+createSupabaseProfileRow\s*=\s*\(\)\s*=>/,
  "script should create user-level Supabase profile rows"
);

assert.match(
  script,
  /assessment\s*:\s*readJsonStorage\s*\(\s*STORAGE_KEYS\.assessment/,
  "profile rows should map assessment from assessment storage"
);

assert.match(
  script,
  /weekly_schedule\s*:\s*readJsonStorage\s*\(\s*STORAGE_KEYS\.weeklySchedule/,
  "profile rows should map weekly_schedule from weekly schedule storage"
);

assert.match(
  script,
  /safety_events\s*:\s*readJsonStorage\s*\(\s*STORAGE_KEYS\.safetyEvents/,
  "profile rows should map safety_events from safety event storage"
);

assert.match(
  saveSupabaseProfileBody,
  /if\s*\(\s*!canUseSupabaseSync\s*\(\s*\)\s*\)\s*return/,
  "profile saves should remain local-only when Supabase sync is unavailable"
);

assert.match(
  saveSupabaseProfileBody,
  /setSyncStatus\s*\(\s*t\s*\(\s*"sync\.statusSaving"\s*\)\s*\)/,
  "profile saves should report saving status before upsert"
);

assert.match(
  saveSupabaseProfileBody,
  /setSyncStatus\s*\(\s*t\s*\(\s*"sync\.statusSaved"\s*\)\s*,\s*"connected"\s*\)/,
  "profile saves should report saved status after successful upsert"
);

assert.match(
  saveSupabaseProfileBody,
  /setSyncStatus\s*\(\s*t\s*\(\s*"sync\.statusError"\s*\)\s*,\s*"error"\s*\)/,
  "profile saves should report error status on failure"
);

assert.match(
  loadSupabaseProfileBody,
  /if\s*\(\s*!canUseSupabaseSync\s*\(\s*\)\s*\)\s*return/,
  "profile loads should remain local-only when Supabase sync is unavailable"
);

assert.match(
  loadSupabaseProfileBody,
  /if\s*\(\s*error\s*\)\s*throw\s+error/,
  "profile loads should throw Supabase errors for centralized handling"
);

assert.match(
  loadSupabaseProfileBody,
  /if\s*\(\s*!data\s*\)\s*return/,
  "profile loads should quietly no-op when no profile exists"
);

assert.match(
  loadSupabaseProfileBody,
  /console\.warn\s*\(\s*"Could not load rehab profile\."/,
  "profile loads should warn on Supabase errors"
);

assert.match(
  loadSupabaseProfileBody,
  /setSyncStatus\s*\(\s*t\s*\(\s*"sync\.statusError"\s*\)\s*,\s*"error"\s*\)/,
  "profile loads should report error status on Supabase errors"
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
assert.match(schema, /create table if not exists public\.rehab_profiles/i);
assert.match(schema, /assessment jsonb not null default '\{\}'::jsonb/i);
assert.match(schema, /weekly_schedule jsonb not null default '\[\]'::jsonb/i);
assert.match(schema, /safety_events jsonb not null default '\[\]'::jsonb/i);
assert.match(schema, /Users can read own rehab profile/);
assert.match(schema, /Users can insert own rehab profile/);
assert.match(schema, /Users can update own rehab profile/);
assert.match(schema, /Users can delete own rehab profile/);
assert.match(schema, /enable row level security/i);
assert.match(schema, /auth\.uid\(\) = user_id/i);
