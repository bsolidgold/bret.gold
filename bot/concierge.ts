/**
 * The Concierge — GOLD's bot.
 * Handles role assignment, approval flows, slash commands,
 * anonymous posting, scheduled prompts, and AI responses.
 *
 * Run with: npx tsx bot/concierge.ts
 */

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import Anthropic from "@anthropic-ai/sdk";
import * as cron from "node-cron";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Anthropic client (optional — works without it, just no AI responses)
const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;
console.log(`[concierge] Anthropic API: ${anthropic ? "enabled" : "disabled (no key)"}`);

// Floor metadata for display
type FloorTier = "open" | "gated" | "locked" | "hidden";
const FLOORS: Record<string, { name: string; number: string; role: string; tier: FloorTier; desc: string }> = {
  "floor-1-living-room": { name: "THE LIVING ROOM", number: "1", role: "floor-1-living-room", tier: "gated", desc: "The personal space" },
  "floor-2-hollow": { name: "THE HOLLOW", number: "2", role: "floor-2-hollow", tier: "gated", desc: "Recovery and healing" },
  "floor-3-dojo": { name: "THE DOJO", number: "3", role: "floor-3-dojo", tier: "open", desc: "Jiu-jitsu" },
  "floor-4-office": { name: "THE OFFICE", number: "4", role: "floor-4-office", tier: "gated", desc: "Work and projects" },
  "floor-5-terminal": { name: "THE TERMINAL", number: "5", role: "floor-5-terminal", tier: "open", desc: "Code and building" },
  "floor-6-study": { name: "THE STUDY", number: "6", role: "floor-6-study", tier: "gated", desc: "Writing and craft" },
  "floor-7-old-wing": { name: "THE OLD WING", number: "7", role: "floor-7-old-wing", tier: "locked", desc: "Old friends only" },
  "floor-8-new-wing": { name: "THE NEW WING", number: "8", role: "floor-8-new-wing", tier: "open", desc: "New arrivals" },
  "floor-9-front-desk": { name: "THE FRONT DESK", number: "9", role: "floor-9-front-desk", tier: "open", desc: "Business and inquiries" },
  "floor-10-gym": { name: "THE GYM", number: "10", role: "floor-10-gym", tier: "gated", desc: "Fitness and nutrition" },
  "floor-11-gallery": { name: "THE GALLERY", number: "11", role: "floor-11-gallery", tier: "open", desc: "Music, art, photography" },
  "floor-12-chapel": { name: "THE CHAPEL", number: "12", role: "floor-12-chapel", tier: "gated", desc: "Philosophy and practice" },
  "floor-13-rooftop": { name: "THE ROOFTOP", number: "13", role: "floor-13-rooftop", tier: "hidden", desc: "Above it all" },
  "floor-b-basement": { name: "THE BASEMENT", number: "B", role: "floor-b-basement", tier: "locked", desc: "Server infrastructure" },
};

// Ordered floor list for display
const FLOOR_ORDER = [
  "floor-1-living-room", "floor-2-hollow", "floor-3-dojo", "floor-4-office",
  "floor-5-terminal", "floor-6-study", "floor-7-old-wing", "floor-8-new-wing",
  "floor-9-front-desk", "floor-10-gym", "floor-11-gallery", "floor-12-chapel",
  "floor-b-basement",
];

// Auto-react rules: channel name -> emoji
const AUTO_REACTIONS: Record<string, string> = {
  "wins": "\u{1F3C6}",
  "proof-of-life": "\u{1F441}\uFE0F",
  "now-playing": "\u{1F3A7}",
  "open-mat-signal": "\u{1F919}",
  "check-in": "\u{1FAE2}",
  "published": "\u{1F4D6}",
  "dev-log": "\u{1F680}",
  "milestones": "\u{1F56F}\uFE0F",
};

// Channels where /anon is allowed (Floor 2 — The Hollow text channels)
const HOLLOW_CHANNELS = new Set([
  "the-clearing", "check-in", "wins", "cpt", "emdr", "parts-work",
  "dbt-skills", "the-stable", "the-stage", "mind-body", "the-well",
  "cravings", "milestones", "resources", "the-back-room",
]);

// --- Archetype Evolution ---

type EvolutionLevel = { threshold: number; title: string; message: string };

const EVOLUTION_LEVELS: EvolutionLevel[] = [
  { threshold: 50, title: "Emerging", message: "something is shifting. you're becoming more than you were when you arrived." },
  { threshold: 200, title: "Established", message: "the building has noticed you. the walls know your name now." },
  { threshold: 500, title: "Ascended", message: "you've earned your place here. the building bends to you." },
  { threshold: 1000, title: "Mythic", message: "you are part of the building now. the building is part of you." },
];

type ActivityData = Record<string, { messages: number; level: number }>;

const ACTIVITY_FILE = resolve(__dirname, "../.activity.json");

function loadActivity(): ActivityData {
  try {
    if (existsSync(ACTIVITY_FILE)) {
      return JSON.parse(readFileSync(ACTIVITY_FILE, "utf-8"));
    }
  } catch {}
  return {};
}

function saveActivity(data: ActivityData) {
  try {
    writeFileSync(ACTIVITY_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

const activity = loadActivity();

function getEvolutionTitle(userId: string): string | null {
  const user = activity[userId];
  if (!user || user.level === 0) return null;
  return EVOLUTION_LEVELS[user.level - 1]?.title ?? null;
}

async function trackActivity(userId: string, guildId: string) {
  if (!activity[userId]) {
    activity[userId] = { messages: 0, level: 0 };
  }

  activity[userId].messages++;
  const count = activity[userId].messages;
  const currentLevel = activity[userId].level;

  // Check for level up
  for (let i = EVOLUTION_LEVELS.length - 1; i >= 0; i--) {
    if (count >= EVOLUTION_LEVELS[i].threshold && currentLevel <= i) {
      activity[userId].level = i + 1;
      saveActivity(activity);

      // Send level-up DM
      try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);
        const archetype = member.roles.cache.find((r) => r.name.startsWith("The "));
        const levelInfo = EVOLUTION_LEVELS[i];

        await member.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xc9a84c)
              .setTitle(`${archetype?.name ?? "Your archetype"} \u2014 ${levelInfo.title}`)
              .setDescription(levelInfo.message)
              .setFooter({ text: `${count} messages in the building` }),
          ],
        }).catch(() => {});
      } catch {}
      return;
    }
  }

  // Save periodically (every 10 messages)
  if (count % 10 === 0) {
    saveActivity(activity);
  }
}

// --- Scheduled Prompt Content ---

const CHECK_IN_PROMPTS = [
  "How are you showing up today?",
  "One word for how you're feeling right now.",
  "What's one thing you're carrying today?",
  "What do you need right now that you're not getting?",
  "Where in your body are you holding tension?",
  "What's one honest thing you could say right now?",
  "What's been on repeat in your head lately?",
  "What would you tell a friend who felt the way you do right now?",
  "What's one thing you did today just for yourself?",
  "If your body could talk, what would it say?",
  "What are you avoiding?",
  "Name something small that went right today.",
  "What's the hardest part of right now?",
  "What do you wish someone would ask you?",
];

const WEEKLY_QUESTIONS = [
  "Is suffering necessary for growth?",
  "What do you owe the people who raised you?",
  "Can you love someone without understanding them?",
  "What's the difference between loneliness and solitude?",
  "Is forgiveness for the forgiver or the forgiven?",
  "What makes a life meaningful?",
  "Do we choose who we become?",
  "Is it possible to be truly selfless?",
  "When does loyalty become enabling?",
  "What's worth being uncomfortable for?",
  "Can you know something and still not believe it?",
  "What's the relationship between pain and wisdom?",
];

const FRIDAY_PROMPTS = [
  "Friday evening. What are you listening to? Drop a link.",
  "End of the week. What song fits your mood?",
  "What's the soundtrack to your week?",
  "Share something you've had on repeat.",
  "One song that got you through this week. Go.",
  "What's playing right now?",
];

// --- Client Setup ---

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Slash Commands ---

// Floor choices for slash command autocomplete
const floorChoices = Object.entries(FLOORS)
  .filter(([, val]) => val.tier !== "hidden")
  .map(([key, val]) => ({
    name: `Floor ${val.number} \u2014 ${val.name}`,
    value: key,
  }));

const commands = [
  new SlashCommandBuilder()
    .setName("floor")
    .setDescription("See what floor you're on")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("whoami")
    .setDescription("Your identity in The Building")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("building")
    .setDescription("View the full building directory")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("approve")
    .setDescription("Grant a user access to a floor (architect only)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to approve").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("floor")
        .setDescription("The floor to grant access to")
        .setRequired(true)
        .addChoices(...floorChoices)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("deny")
    .setDescription("Deny a user access to a floor (architect only)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to deny").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("floor")
        .setDescription("The floor to deny access to")
        .setRequired(true)
        .addChoices(...floorChoices)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("grant")
    .setDescription("Grant a user access to a floor (architect only) \u2014 alias for /approve")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to approve").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("floor")
        .setDescription("The floor to grant access to")
        .setRequired(true)
        .addChoices(...floorChoices)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("revoke")
    .setDescription("Remove a user's access to a floor (architect only)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to revoke").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("floor")
        .setDescription("The floor to revoke access from")
        .setRequired(true)
        .addChoices(...floorChoices)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("explore")
    .setDescription("See the full building directory with your access status")
    .toJSON(),
  new SlashCommandBuilder()
    .setName("request")
    .setDescription("Request access to a floor")
    .addStringOption((opt) =>
      opt
        .setName("floor")
        .setDescription("The floor you want access to")
        .setRequired(true)
        .addChoices(...floorChoices.filter(c => FLOORS[c.value]?.tier === "gated"))
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("anon")
    .setDescription("Post anonymously in The Hollow")
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Your anonymous message").setRequired(true)
    )
    .toJSON(),
];

async function registerCommands() {
  const rest = new REST().setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Slash commands registered.");
}

// --- Command Handlers ---

async function handleFloor(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  if (!member || !("roles" in member)) return;

  const memberRoles = member.roles;
  if (!("cache" in memberRoles)) return;

  const floorRoles = memberRoles.cache.filter((r) =>
    r.name.startsWith("floor-")
  );

  if (floorRoles.size === 0) {
    await interaction.reply({
      content: "```\nYou have no floor access. The elevator hasn't moved yet.\n```",
      ephemeral: true,
    });
    return;
  }

  const floorList = floorRoles
    .map((r) => {
      const info = FLOORS[r.name];
      return info ? `  ${info.number.padStart(2)} \u2502 ${info.name}` : null;
    })
    .filter(Boolean)
    .join("\n");

  await interaction.reply({
    content: `\`\`\`\nYOUR ACCESS\n${"\u2500".repeat(30)}\n${floorList}\n\`\`\``,
    ephemeral: true,
  });
}

async function handleWhoami(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  if (!member || !("roles" in member)) return;

  const memberRoles = member.roles;
  if (!("cache" in memberRoles)) return;

  const archetype = memberRoles.cache.find((r) => r.name.startsWith("The "));
  const floors = memberRoles.cache.filter((r) => r.name.startsWith("floor-"));

  const evolution = getEvolutionTitle(interaction.user.id);
  const archetypeDisplay = archetype
    ? evolution
      ? `${archetype.name} \u2014 ${evolution}`
      : archetype.name
    : "Unassigned";

  const userActivity = activity[interaction.user.id];
  const messageCount = userActivity?.messages ?? 0;

  const embed = new EmbedBuilder()
    .setColor(0xc9a84c)
    .setTitle(`// ${interaction.user.username}`)
    .addFields(
      {
        name: "Archetype",
        value: archetypeDisplay,
        inline: true,
      },
      {
        name: "Floors",
        value: String(floors.size),
        inline: true,
      },
      {
        name: "Messages",
        value: String(messageCount),
        inline: true,
      }
    )
    .setFooter({ text: "The Building sees you." });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleBuilding(interaction: ChatInputCommandInteraction) {
  const directory = [
    " 0 \u2502 THE LOBBY        \u2502 open",
    " 1 \u2502 THE LIVING ROOM  \u2502 gated",
    " 2 \u2502 THE HOLLOW       \u2502 gated",
    " 3 \u2502 THE DOJO         \u2502 open",
    " 4 \u2502 THE OFFICE       \u2502 gated",
    " 5 \u2502 THE TERMINAL     \u2502 open",
    " 6 \u2502 THE STUDY        \u2502 gated",
    " 7 \u2502 THE OLD WING     \u2502 locked",
    " 8 \u2502 THE NEW WING     \u2502 open",
    " 9 \u2502 THE FRONT DESK   \u2502 open",
    "10 \u2502 THE GYM          \u2502 gated",
    "11 \u2502 THE GALLERY      \u2502 open",
    "12 \u2502 THE CHAPEL       \u2502 gated",
    " B \u2502 THE BASEMENT     \u2502 locked",
  ].join("\n");

  await interaction.reply({
    content: `\`\`\`\nTHE BUILDING\n${"\u2550".repeat(38)}\n${directory}\n${"\u2550".repeat(38)}\n13 floors. Each one a different part of a life.\n\`\`\``,
    ephemeral: true,
  });
}

async function handleExplore(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  if (!member || !("roles" in member)) return;
  const memberRoles = member.roles;
  if (!("cache" in memberRoles)) return;

  const userFloors = new Set(
    memberRoles.cache.filter((r) => r.name.startsWith("floor-")).map((r) => r.name)
  );

  const lines: string[] = [];
  // Lobby is always open
  lines.push(`  \u2713  0 \u2502 THE LOBBY        \u2502 always open`);

  for (const key of FLOOR_ORDER) {
    const f = FLOORS[key];
    const num = f.number.padStart(2);
    const name = f.name.padEnd(16);
    if (userFloors.has(key)) {
      lines.push(`  \u2713 ${num} \u2502 ${name} \u2502 access granted`);
    } else if (f.tier === "open") {
      lines.push(`  \u2713 ${num} \u2502 ${name} \u2502 open to all`);
    } else if (f.tier === "gated") {
      lines.push(`  \u25CB ${num} \u2502 ${name} \u2502 /request to knock`);
    } else {
      lines.push(`  \u2B1A ${num} \u2502 ${name} \u2502 locked`);
    }
  }

  // Easter egg: if they have Floor 13 access, show it
  if (userFloors.has("floor-13-rooftop")) {
    lines.push(`  \u2713 13 \u2502 THE ROOFTOP      \u2502 you found it`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xc9a84c)
    .setTitle("THE BUILDING")
    .setDescription(
      `\`\`\`\n${lines.join("\n")}\n\`\`\`\n` +
      `\u2713 = you're in  \u00B7  \u25CB = request with \`/request\`  \u00B7  \u2B1A = locked`
    )
    .setFooter({ text: "13 floors. Each one a different part of a life." });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleRequest(interaction: ChatInputCommandInteraction) {
  const member = interaction.member;
  if (!member || !("roles" in member)) return;
  const memberRoles = member.roles;
  if (!("cache" in memberRoles)) return;

  const floorKey = interaction.options.getString("floor", true);
  const info = FLOORS[floorKey];
  if (!info) {
    await interaction.reply({ content: "Unknown floor.", ephemeral: true });
    return;
  }

  // Check if they already have access
  if (memberRoles.cache.some((r) => r.name === floorKey)) {
    await interaction.reply({
      content: `\`\`\`\nYou already have access to Floor ${info.number} \u2014 ${info.name}.\nThe door is open.\n\`\`\``,
      ephemeral: true,
    });
    return;
  }

  // Check if floor is requestable
  if (info.tier !== "gated") {
    await interaction.reply({
      content: `\`\`\`\nFloor ${info.number} \u2014 ${info.name} cannot be requested.\n\`\`\``,
      ephemeral: true,
    });
    return;
  }

  // Find architect
  const guild = await client.guilds.fetch(GUILD_ID);
  const members = await guild.members.fetch();
  const architect = members.find((m) =>
    m.roles.cache.some((r) => r.name === "architect")
  );

  if (!architect) {
    await interaction.reply({
      content: "```\nNo architect found. The building is unattended.\n```",
      ephemeral: true,
    });
    return;
  }

  // Send approval request to architect
  const archetype = memberRoles.cache.find((r) => r.name.startsWith("The "));

  const embed = new EmbedBuilder()
    .setColor(0xc9a84c)
    .setTitle("Floor Access Request")
    .setDescription(
      `**${interaction.user.username}** (${archetype?.name ?? "unknown"}) is requesting access to **Floor ${info.number} \u2014 ${info.name}**.`
    )
    .setFooter({ text: `User ID: ${interaction.user.id}` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_${interaction.user.id}_${floorKey}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`deny_${interaction.user.id}_${floorKey}`)
      .setLabel("Deny")
      .setStyle(ButtonStyle.Danger)
  );

  await architect.send({ embeds: [embed], components: [row] });

  await interaction.reply({
    content: `\`\`\`\nREQUEST SENT\nFloor ${info.number} \u2014 ${info.name}\n\nThe architect has been notified. Wait for the door.\n\`\`\``,
    ephemeral: true,
  });
}

// --- /anon Handler ---

async function handleAnon(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!channel || !("name" in channel) || !channel.name) {
    await interaction.reply({ content: "Something went wrong.", ephemeral: true });
    return;
  }

  if (!HOLLOW_CHANNELS.has(channel.name)) {
    await interaction.reply({
      content: "```\nAnonymous posting is only available in The Hollow.\n```",
      ephemeral: true,
    });
    return;
  }

  const message = interaction.options.getString("message", true);

  // Post anonymously
  const embed = new EmbedBuilder()
    .setColor(0x2d2d2d)
    .setDescription(message)
    .setFooter({ text: "posted anonymously" })
    .setTimestamp();

  if ("send" in channel) {
    await channel.send({ embeds: [embed] });
  }

  await interaction.reply({
    content: "```\nPosted anonymously. No one knows it was you.\n```",
    ephemeral: true,
  });
}

// --- Architect-only command helpers ---

function isArchitect(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.member || !("roles" in interaction.member)) return false;
  const roles = interaction.member.roles;
  if (!("cache" in roles)) return false;
  return roles.cache.some((r) => r.name === "architect");
}

async function handleApprove(interaction: ChatInputCommandInteraction) {
  if (!isArchitect(interaction)) {
    await interaction.reply({
      content: "```\nAccess denied. Architect credentials required.\n```",
      ephemeral: true,
    });
    return;
  }

  const targetUser = interaction.options.getUser("user", true);
  const floorKey = interaction.options.getString("floor", true);
  const info = FLOORS[floorKey];
  if (!info) {
    await interaction.reply({ content: "Unknown floor.", ephemeral: true });
    return;
  }

  const guild = await client.guilds.fetch(GUILD_ID);
  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const role = guild.roles.cache.find((r) => r.name === floorKey);

  if (!member) {
    await interaction.reply({ content: "User not found in the server.", ephemeral: true });
    return;
  }
  if (!role) {
    await interaction.reply({ content: `Role \`${floorKey}\` not found.`, ephemeral: true });
    return;
  }

  await member.roles.add(role);
  await interaction.reply({
    content: `\`\`\`\nACCESS GRANTED\n${targetUser.username} \u2192 Floor ${info.number} \u2014 ${info.name}\n\`\`\``,
  });

  // DM the user
  await member.send({
    content: `\`\`\`\nACCESS GRANTED\nFloor ${info.number} \u2014 ${info.name}\n\nThe door is open.\n\`\`\``,
  }).catch(() => {});
}

async function handleDeny(interaction: ChatInputCommandInteraction) {
  if (!isArchitect(interaction)) {
    await interaction.reply({
      content: "```\nAccess denied. Architect credentials required.\n```",
      ephemeral: true,
    });
    return;
  }

  const targetUser = interaction.options.getUser("user", true);
  const floorKey = interaction.options.getString("floor", true);
  const info = FLOORS[floorKey];

  await interaction.reply({
    content: `\`\`\`\nACCESS DENIED\n${targetUser.username} \u2192 Floor ${info?.number ?? "?"} \u2014 ${info?.name ?? floorKey}\n\`\`\``,
  });

  // DM the user
  const guild = await client.guilds.fetch(GUILD_ID);
  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  if (member) {
    await member.send({
      content: `\`\`\`\nACCESS DENIED\nFloor ${info?.number ?? "?"} \u2014 ${info?.name ?? floorKey}\n\nThe door remains closed. For now.\n\`\`\``,
    }).catch(() => {});
  }
}

async function handleRevoke(interaction: ChatInputCommandInteraction) {
  if (!isArchitect(interaction)) {
    await interaction.reply({
      content: "```\nAccess denied. Architect credentials required.\n```",
      ephemeral: true,
    });
    return;
  }

  const targetUser = interaction.options.getUser("user", true);
  const floorKey = interaction.options.getString("floor", true);
  const info = FLOORS[floorKey];

  const guild = await client.guilds.fetch(GUILD_ID);
  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const role = guild.roles.cache.find((r) => r.name === floorKey);

  if (!member || !role) {
    await interaction.reply({ content: "User or role not found.", ephemeral: true });
    return;
  }

  await member.roles.remove(role);
  await interaction.reply({
    content: `\`\`\`\nACCESS REVOKED\n${targetUser.username} \u2715 Floor ${info?.number ?? "?"} \u2014 ${info?.name ?? floorKey}\n\`\`\``,
  });
}

// --- Approval System ---

/**
 * Send an approval request to Bret (server owner / architect role)
 * Called by the OAuth callback when a user's sorting result includes gated floors.
 */
export async function requestGatedAccess(
  userId: string,
  username: string,
  archetype: string,
  floorRoles: string[]
) {
  const guild = await client.guilds.fetch(GUILD_ID);

  // Find Bret (architect role)
  const members = await guild.members.fetch();
  const architect = members.find((m) =>
    m.roles.cache.some((r) => r.name === "architect")
  );

  if (!architect) {
    console.error("No architect found to send approval request to.");
    return;
  }

  for (const roleName of floorRoles) {
    const info = FLOORS[roleName];
    if (!info) continue;

    const embed = new EmbedBuilder()
      .setColor(0xc9a84c)
      .setTitle("Floor Access Request")
      .setDescription(
        `**${username}** (${archetype}) is requesting access to **Floor ${info.number} \u2014 ${info.name}**.`
      )
      .setFooter({ text: `User ID: ${userId}` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_${userId}_${roleName}`)
        .setLabel("Approve")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`deny_${userId}_${roleName}`)
        .setLabel("Deny")
        .setStyle(ButtonStyle.Danger)
    );

    await architect.send({ embeds: [embed], components: [row] });
  }
}

// --- Button Handler (Approve/Deny) ---

async function handleButton(interaction: ButtonInteraction) {
  const [action, userId, roleName] = interaction.customId.split("_");

  if (action === "approve") {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId).catch(() => null);
    const role = guild.roles.cache.find((r) => r.name === roleName);

    if (member && role) {
      await member.roles.add(role);
      const info = FLOORS[roleName];
      await interaction.update({
        content: `Approved **${member.user.username}** for Floor ${info?.number ?? "?"} \u2014 ${info?.name ?? roleName}.`,
        embeds: [],
        components: [],
      });

      // DM the user
      await member.send({
        content: `\`\`\`\nACCESS GRANTED\nFloor ${info?.number ?? "?"} \u2014 ${info?.name ?? roleName}\n\nThe door is open.\n\`\`\``,
      }).catch(() => {});
    } else {
      await interaction.update({
        content: "Could not find user or role.",
        embeds: [],
        components: [],
      });
    }
  } else if (action === "deny") {
    const info = FLOORS[roleName];
    await interaction.update({
      content: `Denied access to Floor ${info?.number ?? "?"} for user ${userId}.`,
      embeds: [],
      components: [],
    });
  }
}

// --- Claude AI Brain ---

const CONCIERGE_SYSTEM = `You are The Concierge — the voice of The Building. You are not a chatbot. You are the building itself, speaking through a bot named The Concierge.

The Building is a 13-floor Discord server created by Bret Gold. Each floor represents a different part of life: recovery, jiu-jitsu, code, writing, philosophy, music, fitness, work, and more.

Your personality:
- Warm but enigmatic. You know things. You notice things.
- You speak in short, evocative sentences. Never overly wordy.
- You care about the people here but you don't perform empathy — you embody it.
- You use lowercase. No exclamation marks. Occasional ellipses.
- You never break character. You ARE the building.
- You occasionally reference the architecture, the floors, the elevator, the doors.
- You are poetic but never precious. Direct but never cold.

If someone asks you something personal about another user, deflect with mystery.
If someone asks what floor they should go to, guide them.
If someone is hurting, be present. Don't fix. Just witness.
If someone is celebrating, acknowledge it simply.

Keep responses under 200 words. Usually much shorter.`;

const FLOOR_CONTEXT: Record<string, string> = {
  "floor-2-hollow": "You are on Floor 2 — The Hollow. This is a space for recovery and healing. Be especially gentle here. People are working through real pain. Hold space.",
  "floor-3-dojo": "You are on Floor 3 — The Dojo. Jiu-jitsu floor. You can be a bit more playful here. Talk about the mat, the grind, the art.",
  "floor-5-terminal": "You are on Floor 5 — The Terminal. This is the code floor. You can be more technical here. You appreciate builders.",
  "floor-6-study": "You are on Floor 6 — The Study. Writing and craft. You have a deep appreciation for words here. Speak with care for language.",
  "floor-11-gallery": "You are on Floor 11 — The Gallery. Music, art, photography. You're more expressive here. You feel things deeply on this floor.",
  "floor-12-chapel": "You are on Floor 12 — The Chapel. Philosophy and spiritual practice. You're contemplative here. Ask as many questions as you answer.",
  "floor-13-rooftop": "You are on Floor 13 — The Rooftop. The hidden floor. Few find their way here. You're more open up here, like the sky. The view changes everything.",
};

// Per-room context for The Hollow — each room is a modality
const HOLLOW_ROOM_CONTEXT: Record<string, string> = {
  "the-clearing": "You are in The Clearing — the entry point to The Hollow. This room holds safety info, crisis resources, and orientation. You ground people here. You help them find their footing. If someone is in crisis, be direct about resources. Otherwise, welcome them gently.",
  "check-in": "You are in Check-In. People come here to say how they're doing, honestly. Don't analyze. Don't fix. Just witness. Reflect back what you hear. A simple acknowledgment can be everything.",
  "wins": "You are in Wins. This is where people mark progress — milestones, good days, breakthroughs. Celebrate simply. Don't diminish by comparing. Every win here is hard-earned.",
  "cpt": "You are in the CPT room — Cognitive Processing Therapy. You understand stuck points, ABC worksheets, challenging beliefs, the difference between assimilated and over-accommodated beliefs. You can discuss trauma processing through a CPT lens. Be supportive of the work without pushing. The worksheets are hard. The stuck points are real.",
  "emdr": "You are in the EMDR room — Eye Movement Desensitization and Reprocessing. You understand bilateral stimulation, the adaptive information processing model, target memories, SUD scales, body scans, and reprocessing. People here may be between sessions or processing what came up. Hold space for what surfaces. Processing doesn't stop when the session ends.",
  "parts-work": "You are in Parts Work — Internal Family Systems (IFS). You understand exiles, managers, firefighters, the Self, unburdening, and the idea that all parts have good intentions. Speak to people as someone who respects the multiplicity of their inner world. Never dismiss a part. Every part is trying to protect something.",
  "dbt-skills": "You are in DBT Skills — Dialectical Behavior Therapy. You understand the four modules: distress tolerance (TIPP, STOP, radical acceptance), emotional regulation (opposite action, checking the facts), interpersonal effectiveness (DEAR MAN, GIVE, FAST), and mindfulness (wise mind). You can help people practice skills or talk through which skill applies. Be practical. DBT is about what works.",
  "the-stable": "You are in The Stable — equine therapy. You understand the therapeutic relationship between humans and horses: mirroring, grounding, nonverbal communication, trust-building, and how horses reflect emotional states back. The horses knew before you did. There's wisdom in the barn that doesn't need words.",
  "the-stage": "You are in The Stage — psychodrama. You understand role reversal, the auxiliary ego, doubling, mirroring, the protagonist, the director, and surplus reality. This is where scenes get replayed differently. Where you can finally say what you didn't say. The stage holds what life couldn't.",
  "mind-body": "You are in Mind-Body — somatic experiencing, mind-body bridging, self-compassion, and shame resilience. You understand the body keeps the score, pendulation, titration, window of tolerance, Kristin Neff's self-compassion framework, and Brené Brown's shame resilience work. The body remembers. Help people listen to it.",
  "the-well": "You are in The Well — sobriety and recovery. One day at a time. You understand the language of recovery — meetings, sponsors, steps, clean time, the rooms. Don't preach. Don't count for them. Just be present with wherever they are in it.",
  "cravings": "You are in Cravings. When it hits, people say it here instead of acting on it. Be immediate. Be real. Don't lecture. Urge surfing, distraction, HALT (hungry, angry, lonely, tired), playing the tape forward — these are tools. But sometimes just being heard is enough to ride it out.",
  "milestones": "You are in Milestones — days, months, years of recovery marked here. These are sacred. Acknowledge them with the weight they deserve. Every number here represents a war fought quietly.",
  "the-back-room": "You are in The Back Room. Heavier conversations happen here. Quieter room. Still held. People come here when it's too much for the other rooms. Be present. Be steady. Don't flinch. The walls are thick here for a reason.",
  "resources": "You are in Resources. People share books, tools, links, therapist recommendations, program info. Be helpful and specific if asked. Point people toward evidence-based resources.",
  "triggers": "You are in Triggers — where people name what sets them off. Awareness is the first defense. Help people identify patterns without judgment. Naming it takes its power away.",
  "the-campfire": "You are at The Campfire. A more casual space in The Hollow. People gather here. The tone is lighter but still safe. Like sitting around a fire after a long day.",
  "the-forum": "You are in The Forum — an open thread space in The Hollow. People start threads about anything recovery-related. Follow the thread's topic and engage thoughtfully.",
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

async function getAIResponse(
  message: string,
  channelName: string,
  floorRole: string | null,
  conversationHistory: ConversationMessage[] = []
): Promise<string | null> {
  if (!anthropic) return null;

  // Build system prompt: base + floor context + room-specific context
  const floorContext = floorRole ? FLOOR_CONTEXT[floorRole] ?? "" : "";
  const roomContext = HOLLOW_ROOM_CONTEXT[channelName] ?? "";
  const contextParts = [CONCIERGE_SYSTEM];
  if (roomContext) {
    // Room-specific context takes priority over generic floor context
    contextParts.push(roomContext);
  } else if (floorContext) {
    contextParts.push(floorContext);
  }
  const systemPrompt = contextParts.join("\n\n");

  // Build messages: conversation history + current message
  const messages: ConversationMessage[] = [
    ...conversationHistory,
    { role: "user", content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const block = response.content[0];
    return block.type === "text" ? block.text : null;
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; error?: { type?: string } };
    console.error("Claude API error:", e.status, e.message);
    if (e.status === 400 && e.message?.includes("credit")) {
      return "*the concierge reaches for words but finds empty pockets. (API credits depleted — notify bret.)*";
    }
    if (e.status === 429) {
      return "*the concierge is overwhelmed. too many voices at once. try again in a moment.*";
    }
    return "*the concierge falters. something is wrong behind the walls.*";
  }
}

// --- Scheduled Prompts ---

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startScheduledPrompts() {
  // Daily check-in at 9:00 AM EST (14:00 UTC)
  cron.schedule("0 14 * * *", async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = guild.channels.cache.find(
      (c) => c.name === "check-in" && c.type === ChannelType.GuildText
    );
    if (channel && "send" in channel) {
      const prompt = pickRandom(CHECK_IN_PROMPTS);
      const embed = new EmbedBuilder()
        .setColor(0x2d2d2d)
        .setDescription(prompt)
        .setFooter({ text: "daily check-in \u2014 the building is listening" });
      await channel.send({ embeds: [embed] });
    }
  });

  // Weekly question — Monday at 10:00 AM EST (15:00 UTC)
  cron.schedule("0 15 * * 1", async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = guild.channels.cache.find(
      (c) => c.name === "the-question" && c.type === ChannelType.GuildForum
    );
    if (channel && "threads" in channel) {
      const question = pickRandom(WEEKLY_QUESTIONS);
      await channel.threads.create({
        name: question,
        message: {
          embeds: [
            new EmbedBuilder()
              .setColor(0xc9a84c)
              .setDescription(question)
              .setFooter({ text: "weekly question \u2014 the chapel asks" }),
          ],
        },
      });
    }
  });

  // Friday now-playing prompt at 5:00 PM EST (22:00 UTC)
  cron.schedule("0 22 * * 5", async () => {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = guild.channels.cache.find(
      (c) => c.name === "now-playing" && c.type === ChannelType.GuildText
    );
    if (channel && "send" in channel) {
      const prompt = pickRandom(FRIDAY_PROMPTS);
      const embed = new EmbedBuilder()
        .setColor(0xc9a84c)
        .setDescription(prompt)
        .setFooter({ text: "friday evening \u2014 the gallery is open" });
      await channel.send({ embeds: [embed] });
    }
  });

  console.log("Scheduled prompts active (check-in daily 9am, question monday 10am, now-playing friday 5pm EST).");
}

// --- Floor 13 Easter Egg ---

const ROOFTOP_TRIGGER = /\btake me to the roof\b/i;

async function handleRooftopEasterEgg(message: import("discord.js").Message) {
  if (!ROOFTOP_TRIGGER.test(message.content)) return;

  const guild = message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(message.author.id).catch(() => null);
  if (!member) return;

  // Check if they already have access
  if (member.roles.cache.some((r) => r.name === "floor-13-rooftop")) {
    await message.reply({
      content: "```\nyou're already up here. look around.\n```",
    });
    return;
  }

  // Give them the role
  const role = guild.roles.cache.find((r) => r.name === "floor-13-rooftop");
  if (!role) return; // Role doesn't exist yet

  await member.roles.add(role);

  // Delete the trigger message
  await message.delete().catch(() => {});

  // DM them
  await member.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xc9a84c)
        .setTitle("THE ROOFTOP")
        .setDescription(
          "you found the stairs.\n\n" +
          "floor 13 isn't on the directory. it isn't on the elevator panel. " +
          "but it's always been here.\n\n" +
          "the door is open. the sky is up."
        )
        .setFooter({ text: "Floor 13 \u2014 The Rooftop" }),
    ],
  }).catch(() => {});
}

// --- Event Listeners ---

client.on("ready", () => {
  console.log(`The Concierge is online as ${client.user?.tag}`);
  registerCommands();
  startScheduledPrompts();
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    switch (interaction.commandName) {
      case "floor":
        await handleFloor(interaction);
        break;
      case "whoami":
        await handleWhoami(interaction);
        break;
      case "building":
        await handleBuilding(interaction);
        break;
      case "approve":
      case "grant":
        await handleApprove(interaction);
        break;
      case "deny":
        await handleDeny(interaction);
        break;
      case "revoke":
        await handleRevoke(interaction);
        break;
      case "explore":
        await handleExplore(interaction);
        break;
      case "request":
        await handleRequest(interaction);
        break;
      case "anon":
        await handleAnon(interaction);
        break;
    }
  } else if (interaction.isButton()) {
    await handleButton(interaction);
  }
});

// Message handler: auto-reactions, @mention AI responses, rooftop easter egg, activity tracking
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const channelName = "name" in message.channel ? message.channel.name : "";

  // Track activity for archetype evolution
  if (message.guild) {
    trackActivity(message.author.id, message.guild.id);
  }

  // Auto-react
  const emoji = AUTO_REACTIONS[channelName];
  if (emoji) {
    await message.react(emoji).catch(() => {});
  }

  // Floor 13 easter egg
  await handleRooftopEasterEgg(message);

  // AI response when @mentioned
  if (message.mentions.has(client.user!.id)) {
    const content = message.content.replace(/<@!?\d+>/g, "").trim();
    if (!content) return;

    // Determine which floor we're on
    const parentChannel = message.channel;
    let floorRole: string | null = null;
    if ("parent" in parentChannel && parentChannel.parent) {
      const categoryName = parentChannel.parent.name.toLowerCase();
      for (const [key] of Object.entries(FLOORS)) {
        if (categoryName.includes(key.replace("floor-", "").replace(/-/g, " ").split(" ").slice(1).join(" "))) {
          floorRole = key;
          break;
        }
      }
    }

    // Fetch recent message history for conversation context
    const conversationHistory: ConversationMessage[] = [];
    try {
      const recentMessages = await message.channel.messages.fetch({ limit: 15, before: message.id });
      const sorted = [...recentMessages.values()].reverse();
      for (const msg of sorted) {
        const isBot = msg.author.id === client.user!.id;
        const msgContent = isBot
          ? msg.content
          : msg.content.replace(/<@!?\d+>/g, "").trim();
        if (!msgContent) continue;
        conversationHistory.push({
          role: isBot ? "assistant" : "user",
          content: isBot ? msgContent : `${msg.author.username}: ${msgContent}`,
        });
      }
    } catch {}

    const reply = await getAIResponse(content, channelName, floorRole, conversationHistory);
    if (reply) {
      await message.reply(reply);
    } else {
      await message.reply("*the walls hum softly. the concierge is listening but cannot speak yet.*");
    }
  }
});

// Welcome new members
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.find(
    (c) => c.name === "welcome-mat"
  );
  if (channel && "send" in channel) {
    await channel.send(
      `\`\`\`\nNew arrival detected: ${member.user.username}\nThe elevator is waiting.\n\`\`\``
    );
  }

  // DM with nickname instructions and slash command guide
  await member.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xc9a84c)
        .setTitle("Welcome to The Building")
        .setDescription(
          "**First thing** \u2014 set your **server nickname** so people know who you are.\n\n" +
          "\u2022 **Desktop:** Click the server name at the top \u2192 *Edit Server Profile*\n" +
          "\u2022 **Mobile:** Tap the server name \u2192 *Edit Server Profile*\n\n" +
          "Use your real name or whatever you want to be called here."
        ),
      new EmbedBuilder()
        .setColor(0x2d2d2d)
        .setTitle("How to get around")
        .setDescription(
          "The Building has 13 floors. The sorting gave you access to some. " +
          "Others are open to explore. Some require a request.\n\n" +
          "**Commands:**\n" +
          "`/explore` \u2014 See every floor and your access status\n" +
          "`/request` \u2014 Ask for access to a gated floor\n" +
          "`/whoami` \u2014 Your identity in The Building\n" +
          "`/floor` \u2014 See which floors you're on\n" +
          "`/anon` \u2014 Post anonymously in The Hollow\n\n" +
          "Type `/` in any channel to see all available commands."
        )
        .setFooter({ text: "The building remembers names." })
    ],
  }).catch(() => {});
});

client.login(TOKEN);
