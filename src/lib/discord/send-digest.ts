const DISCORD_API = "https://discord.com/api/v10";

type TranscriptMessage = {
  role: string;
  content: string;
};

type DigestPayload = {
  username: string;
  relationshipType: string;
  archetype: string;
  primaryFloorRoles: string[];
  autoApprovedFloorRoles: string[];
  gatewayFloorRoles: string[];
  transcript: TranscriptMessage[] | null;
};

const FLOOR_NAMES: Record<string, string> = {
  "floor-0-lobby": "Floor 0 — THE LOBBY",
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
  "floor-13-rooftop": "Floor 13 — THE ROOFTOP",
  "floor-b-basement": "Floor B — THE BASEMENT",
};

/**
 * Send a visitor digest DM to Bret (guild owner) via Discord REST API.
 * Includes relationship classification, archetype, floor access, and interview transcript.
 */
export async function sendVisitorDigest(payload: DigestPayload) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    console.log("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID for digest");
    return;
  }

  // Find guild owner (Bret)
  const guildRes = await fetch(`${DISCORD_API}/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!guildRes.ok) {
    console.error("Failed to fetch guild for digest:", guildRes.status);
    return;
  }

  const guild = await guildRes.json();
  const ownerId = guild.owner_id;
  if (!ownerId) return;

  // Create DM channel with owner
  const dmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: ownerId }),
  });

  if (!dmRes.ok) {
    console.error("Failed to create DM channel for digest:", dmRes.status);
    return;
  }

  const dmChannel = await dmRes.json();

  // Build floor access summary
  const grantedFloors = [
    ...payload.primaryFloorRoles,
    ...payload.autoApprovedFloorRoles,
  ]
    .map((r) => FLOOR_NAMES[r] || r)
    .join("\n");

  const pendingFloors = payload.gatewayFloorRoles
    .map((r) => FLOOR_NAMES[r] || r)
    .join("\n");

  // Build embed
  const fields = [
    {
      name: "Relationship",
      value: payload.relationshipType,
      inline: true,
    },
    {
      name: "Archetype",
      value: payload.archetype,
      inline: true,
    },
    {
      name: "Access Granted",
      value: grantedFloors || "*none*",
      inline: false,
    },
  ];

  if (pendingFloors) {
    fields.push({
      name: "Pending Approval",
      value: pendingFloors,
      inline: false,
    });
  }

  // Send the summary embed
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
          title: "New Visitor Digest",
          description: `**${payload.username}** just joined The Building.`,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  // Send the transcript as a follow-up message
  if (payload.transcript && payload.transcript.length > 0) {
    const transcriptLines = payload.transcript.map((m) =>
      m.role === "assistant"
        ? `ELEVATOR: ${m.content}`
        : `VISITOR: ${m.content}`
    );
    const fullTranscript = transcriptLines.join("\n\n");

    // Discord messages are limited to 2000 chars
    const transcriptContent =
      fullTranscript.length > 1850
        ? `**Interview Transcript:**\n\`\`\`\n${fullTranscript.slice(0, 1800)}\n...(truncated)\n\`\`\``
        : `**Interview Transcript:**\n\`\`\`\n${fullTranscript}\n\`\`\``;

    await fetch(`${DISCORD_API}/channels/${dmChannel.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: transcriptContent }),
    });
  }
}
