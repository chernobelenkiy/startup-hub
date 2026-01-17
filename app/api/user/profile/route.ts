import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema, cleanSocialLinks } from "@/lib/validations/user";

/**
 * PATCH /api/user/profile
 * Update the current user's profile with enhanced fields
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.openToContact !== undefined) updateData.openToContact = data.openToContact;
    
    // Clean and store social links
    if (data.socialLinks !== undefined) {
      updateData.socialLinks = cleanSocialLinks(data.socialLinks);
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatarUrl: true,
        bio: true,
        title: true,
        company: true,
        socialLinks: true,
        openToContact: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("[API] Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
