import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/contact
 * Receives contact form submissions and posts them to the #inquiries channel
 * in Discord via the bot token.
 */
export async function POST(req: NextRequest) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let body: { name: string; message: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, message } = body;
  if (!name?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
  }

  if (name.length > 100 || message.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  try {
    // Find the #inquiries channel
    const channelsRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    const channels = await channelsRes.json();
    const inquiries = channels.find(
      (c: { name: string; type: number }) => c.name === "inquiries" && c.type === 0
    );

    if (!inquiries) {
      return NextResponse.json({ error: "Channel not found" }, { status: 500 });
    }

    // Post the message
    const embed = {
      color: 0xc9a84c,
      title: "New message from the front desk",
      fields: [
        { name: "From", value: name.trim(), inline: true },
        { name: "Message", value: message.trim() },
      ],
      footer: { text: "via bret.gold/contact" },
      timestamp: new Date().toISOString(),
    };

    await fetch(
      `https://discord.com/api/v10/channels/${inquiries.id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ embeds: [embed] }),
      }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
