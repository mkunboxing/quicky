import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * POST /api/auth/signup
 * Creates a new email-based user account.
 * Body: { fname, lname, email, password }
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { fname, lname, email, password } = body;

  // Basic validation
  if (!fname?.trim() || !lname?.trim() || !email?.trim() || !password) {
    return Response.json({ message: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ message: "Password must be at least 6 characters" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json({ message: "Invalid email address" }, { status: 400 });
  }

  try {
    // Check if email already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length) {
      return Response.json({ message: "An account with this email already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique externalId for email-signup users
    const externalId = `email_${crypto.randomUUID()}`;

    // Insert user
    const newUser = await db
      .insert(users)
      .values({
        fname: fname.trim(),
        lname: lname.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        provider: "EMAIL",
        externalId,
        role: "customer",
      })
      .returning({ id: users.id, email: users.email, fname: users.fname });

    return Response.json(
      { message: "Account created successfully!", user: newUser[0] },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Signup error:", err);
    return Response.json({ message: "Failed to create account. Please try again." }, { status: 500 });
  }
}
