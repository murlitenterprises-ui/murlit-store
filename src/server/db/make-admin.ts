// Usage: bun src/server/db/make-admin.ts <email>
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun src/server/db/make-admin.ts <email>");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const rows = await sql`UPDATE users SET role = 'admin' WHERE email = ${email} RETURNING id`;
console.log(rows.length ? "OK" : "User not found");
process.exit(0);
