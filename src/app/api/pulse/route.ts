import { NextResponse } from "next/server";

/**
 * GET /api/pulse
 * Returns basic building activity stats from the Discord API.
 * Used by the landing page activity pulse indicator.
 */
export async function GET() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    return NextResponse.json({ alive: false });
  }

  try {
    // Fetch guild preview for member count
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        next: { revalidate: 60 }, // Cache for 60s
      }
    );

    if (!res.ok) {
      return NextResponse.json({ alive: true, members: 0, online: 0 });
    }

    const guild = await res.json();
    return NextResponse.json({
      alive: true,
      members: guild.approximate_member_count ?? 0,
      online: guild.approximate_presence_count ?? 0,
    });
  } catch {
    return NextResponse.json({ alive: true, members: 0, online: 0 });
  }
}
