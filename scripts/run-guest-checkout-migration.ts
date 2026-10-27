/**
 * Run the guest checkout migration against DATABASE_URL.
 * Usage: npx tsx scripts/run-guest-checkout-migration.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = readFileSync(join(import.meta.dirname, "migrate-guest-checkout.sql"), "utf-8");
const db = neon(url);

try {
  // Split on semicolons, run each statement individually
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    await db(stmt);
    console.log("✓", stmt.slice(0, 60).replace(/\s+/g, " ") + "…");
  }
  console.log("\nMigration complete.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
}
