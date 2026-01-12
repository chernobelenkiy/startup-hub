import { headers } from "next/headers";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Extract user ID from API token in Authorization header
 */
export async function extractUserIdFromToken(): Promise<string | null> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.replace("Bearer ", "");
  
  try {
    // Find all non-revoked, non-expired tokens
    const tokens = await prisma.aPIToken.findMany({
      where: {
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    // Compare token with stored hashes
    for (const record of tokens) {
      const isValid = await bcrypt.compare(token, record.tokenHash);
      if (isValid) {
        // Update lastUsedAt (fire-and-forget)
        prisma.aPIToken.update({
          where: { id: record.id },
          data: { lastUsedAt: new Date() }
        }).catch(() => {});
        
        return record.userId;
      }
    }
    
    return null;
  } catch (error) {
    console.error("[MCP Auth] Error:", error);
    return null;
  }
}
