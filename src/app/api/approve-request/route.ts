import { NextResponse } from "next/server";

const DISCORD_API = "https://discord.com/api/v10";

/**
 * Internal API: sends gated floor approval requests to Bret via Discord DM.
 * Called by the OAuth callback after a user joins with gated floor results.
 *
 * The Concierge bot handles this if it's running. This is the fallback
 * that uses the bot token directly to send DMs.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { userId, username, archetype, floorRoles, secret } = body;

  // Simple auth — check the bot token matches
  if (secret !== process.env.DISCORD_BOT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const guildId = process.env.DISCORD_GUILD_ID!;

  // Find the guild owner (Bret) to DM
  const guildRes = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  const guild = await guildRes.json();
  const ownerId = guild.owner_id;

  if (!ownerId) {
    return NextResponse.json(
      { error: "Could not find server owner" },
      { status: 500 }
    );
  }

  // Create DM channel with owner
  const dmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: ownerId }),
  });
  const dmChannel = await dmRes.json();

  // Floor name lookup
  const floorNames: Record<string, string> = {
    "floor-1-living-room": "Floor 1 — THE LIVING ROOM",
    "floor-4-office": "Floor 4 — THE OFFICE",
    "floor-6-study": "Floor 6 — THE STUDY",
    "floor-10-gym": "Floor 10 — THE GYM",
    "floor-12-chapel": "Floor 12 — THE CHAPEL",
  };

  const floorList = floorRoles
    .map((r: string) => floorNames[r] || r)
    .join("\n  ");

  // Send approval request message
  await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: [
        "```",
        "FLOOR ACCESS REQUEST",
        "════════════════════════════════",
        `  User:      ${username}`,
        `  Archetype: ${archetype}`,
        `  Requesting:`,
        `  ${floorList}`,
        "",
        `  User ID: ${userId}`,
        "════════════════════════════════",
        "Use /approve or /deny in the server.",
        "```",
      ].join("\n"),
    }),
  });

  return NextResponse.json({ ok: true });
}
