import { NextResponse } from "next/server";

type ChannelActivity = {
  floor: string;
  channel: string;
  lastMessage: string | null;
};

// Map channel IDs to floor names for display
const FLOOR_MAP: Record<string, string> = {
  "FLOOR 0": "THE LOBBY",
  "FLOOR 1": "THE LIVING ROOM",
  "FLOOR 2": "THE HOLLOW",
  "FLOOR 3": "THE DOJO",
  "FLOOR 4": "THE OFFICE",
  "FLOOR 5": "THE TERMINAL",
  "FLOOR 6": "THE STUDY",
  "FLOOR 7": "THE OLD WING",
  "FLOOR 8": "THE NEW WING",
  "FLOOR 9": "THE FRONT DESK",
  "FLOOR 10": "THE GYM",
  "FLOOR 11": "THE GALLERY",
  "FLOOR 12": "THE CHAPEL",
  "FLOOR 13": "THE ROOFTOP",
  "FLOOR B": "THE BASEMENT",
};

/**
 * GET /api/feed
 * Returns recent channel activity from the Discord server.
 * Shows which floors have had recent messages (no content, just timestamps).
 */
export async function GET() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    return NextResponse.json({ floors: [] });
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ floors: [] });
    }

    const channels: {
      id: string;
      name: string;
      type: number;
      parent_id: string | null;
      last_message_id: string | null;
    }[] = await res.json();

    // Build category map
    const categories = new Map<string, string>();
    for (const ch of channels) {
      if (ch.type === 4) {
        categories.set(ch.id, ch.name);
      }
    }

    // Get text/forum channels with recent messages
    const activity: ChannelActivity[] = [];
    for (const ch of channels) {
      if (ch.type !== 0 && ch.type !== 15) continue; // text or forum only
      if (!ch.parent_id) continue;

      const categoryName = categories.get(ch.parent_id);
      if (!categoryName) continue;

      // Extract floor key from category name (e.g., "FLOOR 3 — THE DOJO" -> "FLOOR 3")
      const floorKey = categoryName.split(" \u2014 ")[0]?.trim();
      const floorName = FLOOR_MAP[floorKey];
      if (!floorName) continue;

      activity.push({
        floor: floorName,
        channel: ch.name,
        lastMessage: ch.last_message_id,
      });
    }

    // Convert snowflake IDs to timestamps and find most recent per floor
    const floorActivity: Record<string, { channel: string; timestamp: number }> = {};

    for (const item of activity) {
      if (!item.lastMessage) continue;
      // Discord snowflake -> timestamp (avoid BigInt for compat)
      const snowflake = parseInt(item.lastMessage, 10);
      const timestamp = Math.floor(snowflake / 4194304) + 1420070400000;

      if (!floorActivity[item.floor] || timestamp > floorActivity[item.floor].timestamp) {
        floorActivity[item.floor] = { channel: item.channel, timestamp };
      }
    }

    // Convert to sorted array
    const floors = Object.entries(floorActivity)
      .map(([floor, data]) => ({
        floor,
        channel: data.channel,
        timestamp: data.timestamp,
        ago: getTimeAgo(data.timestamp),
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8); // Top 8 most recent

    return NextResponse.json({ floors });
  } catch {
    return NextResponse.json({ floors: [] });
  }
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return "quiet";
}
