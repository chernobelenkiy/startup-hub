import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * POST /api/upload
 * Upload a file to Vercel Blob storage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${session.user.id}/${nanoid()}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
