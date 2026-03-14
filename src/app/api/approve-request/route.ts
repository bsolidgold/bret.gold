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
    "floor-2-hollow": "Floor 2 — THE HOLLOW",
    "floor-3-dojo": "Floor 3 — THE DOJO",
    "floor-4-office": "Floor 4 — THE OFFICE",
    "floor-5-terminal": "Floor 5 — THE TERMINAL",
    "floor-6-study": "Floor 6 — THE STUDY",
    "floor-7-old-wing": "Floor 7 — THE OLD WING",
    "floor-8-new-wing": "Floor 8 — THE NEW WING",
    "floor-9-front-desk": "Floor 9 — THE FRONT DESK",
    "floor-10-gym": "Floor 10 — THE GYM",
    "floor-11-gallery": "Floor 11 — THE GALLERY",
    "floor-12-chapel": "Floor 12 — THE CHAPEL",
  };

  // Send one DM per floor with approve/deny buttons
  for (const roleName of floorRoles as string[]) {
    const floorLabel = floorNames[roleName] || roleName;

    await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            color: 0xc9a84c,
            title: "Floor Access Request",
            description: `**${username}** (${archetype}) is requesting access to **${floorLabel}**.`,
            footer: { text: `User ID: ${userId}` },
            timestamp: new Date().toISOString(),
          },
        ],
        components: [
          {
            type: 1, // ActionRow
            components: [
              {
                type: 2, // Button
                style: 3, // Success (green)
                label: "Approve",
                custom_id: `approve_${userId}_${roleName}`,
              },
              {
                type: 2, // Button
                style: 4, // Danger (red)
                label: "Deny",
                custom_id: `deny_${userId}_${roleName}`,
              },
            ],
          },
        ],
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
