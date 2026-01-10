import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/register
 * Creates a new user account with email/password credentials
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and credentials account in a transaction
    const user = await db.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
        },
      });

      // Create credentials account
      // We store the password hash in access_token field for the credentials provider
      await tx.account.create({
        data: {
          userId: newUser.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: newUser.id,
          access_token: passwordHash,
        },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
