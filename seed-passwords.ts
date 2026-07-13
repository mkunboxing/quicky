/**
 * Seed Script: Backfill hashed passwords for all existing users
 *
 * Sets every user's password to the hashed version of "Test@123".
 * Run with:  npm run db:seed-passwords
 */

import bcrypt from "bcryptjs";
import { db } from "./src/lib/db/db";
import { users } from "./src/lib/db/schema";
import * as dotenv from "dotenv";

dotenv.config();

const PLAIN_PASSWORD = "Test@123";
const SALT_ROUNDS = 10;

async function seedPasswords() {
  console.log("🔐 Starting password seed...");

  // Hash the password once and reuse it for all users
  const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, SALT_ROUNDS);
  console.log(`✅ Password hashed (bcrypt, ${SALT_ROUNDS} rounds)`);

  // Fetch all users
  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  console.log(`📋 Found ${allUsers.length} user(s) to update`);

  if (allUsers.length === 0) {
    console.log("⚠️  No users found. Nothing to update.");
    process.exit(0);
  }

  // Bulk update all users with the hashed password
  const { eq } = await import("drizzle-orm");
  let updated = 0;

  for (const user of allUsers) {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));
    console.log(`  ✓ Updated user #${user.id} (${user.email})`);
    updated++;
  }

  console.log(`\n🎉 Done! ${updated} user(s) updated with hashed "Test@123" password.`);
  process.exit(0);
}

seedPasswords().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
