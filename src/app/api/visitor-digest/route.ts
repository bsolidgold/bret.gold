import { NextResponse } from "next/server";
import { sendVisitorDigest } from "@/lib/discord/send-digest";

/**
 * POST /api/visitor-digest
 * Called from the welcome page after OAuth completes.
 * Sends a digest DM to Bret with the visitor's sorting results and interview transcript.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, sortingResult, username } = body;

    if (!sortingResult || !username) {
      return NextResponse.json(
        { error: "sortingResult and username required" },
        { status: 400 }
      );
    }

    await sendVisitorDigest({
      username,
      relationshipType: sortingResult.relationshipType || "unknown",
      archetype: sortingResult.archetype?.name || "unknown",
      primaryFloorRoles: sortingResult.primaryFloorRoles || [],
      autoApprovedFloorRoles: sortingResult.autoApprovedFloorRoles || [],
      gatewayFloorRoles: sortingResult.gatewayFloorRoles || [],
      transcript: transcript || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Visitor digest error:", err);
    return NextResponse.json(
      { error: "Failed to send digest" },
      { status: 500 }
    );
  }
}
