/**
 * One-time setup script: creates the ex-partner "black hole" infrastructure.
 *
 * Creates:
 * - ex-partner role (black color, not hoisted, not mentionable)
 * - THE BLACK HOLE category with one channel: #the-black-hole
 * - Permissions: ex-partner can write but NOT read history (can't see other exes)
 *   Only the architect (Bret / server owner) can read all messages
 *
 * Run with: npx tsx bot/setup-black-hole.ts
 */

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  type Guild,
} from "discord.js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;

async function setupBlackHole(guild: Guild) {
  console.log("[black-hole] Starting setup...");

  // 1. Create or find the ex-partner role
  let exRole = guild.roles.cache.find((r) => r.name === "ex-partner");
  if (!exRole) {
    exRole = await guild.roles.create({
      name: "ex-partner",
      color: 0x000000, // Black — invisible against dark theme
      hoist: false, // Don't show separately in member list
      mentionable: false,
      reason: "Black hole setup: ex-partner isolation role",
    });
    console.log(`[black-hole] Created role: ${exRole.name} (${exRole.id})`);
  } else {
    console.log(`[black-hole] Role already exists: ${exRole.name} (${exRole.id})`);
  }

  // 2. Create or find THE BLACK HOLE category
  let category = guild.channels.cache.find(
    (c) => c.name === "THE BLACK HOLE" && c.type === ChannelType.GuildCategory
  );
  if (!category) {
    category = await guild.channels.create({
      name: "THE BLACK HOLE",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          // @everyone: deny all
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          // ex-partner: can view and send, but NOT read history
          id: exRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
          deny: [PermissionFlagsBits.ReadMessageHistory],
        },
        {
          // Bot: full access for forwarding
          id: guild.client.user!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
      reason: "Black hole setup: ex-partner isolation category",
    });
    console.log(`[black-hole] Created category: ${category.name} (${category.id})`);
  } else {
    console.log(`[black-hole] Category already exists: ${category.name} (${category.id})`);
  }

  // 3. Create #the-black-hole channel inside the category
  let channel = guild.channels.cache.find(
    (c) =>
      c.name === "the-black-hole" &&
      c.type === ChannelType.GuildText &&
      c.parentId === category!.id
  );
  if (!channel) {
    channel = await guild.channels.create({
      name: "the-black-hole",
      type: ChannelType.GuildText,
      parent: category.id,
      topic: "you can speak here. no one else can hear you. except the building.",
      permissionOverwrites: [
        {
          // @everyone: deny all
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          // ex-partner: can view and send, but NOT read history
          id: exRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
          deny: [PermissionFlagsBits.ReadMessageHistory],
        },
        {
          // Bot: full access
          id: guild.client.user!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
          ],
        },
      ],
      reason: "Black hole setup: ex-partner isolation channel",
    });
    console.log(`[black-hole] Created channel: #${channel.name} (${channel.id})`);
  } else {
    console.log(`[black-hole] Channel already exists: #${channel.name} (${channel.id})`);
  }

  console.log("[black-hole] Setup complete.");
  console.log(`  Role: ex-partner (${exRole.id})`);
  console.log(`  Category: THE BLACK HOLE (${category.id})`);
  console.log(`  Channel: #the-black-hole (${channel.id})`);
  console.log("");
  console.log("IMPORTANT: Manually give yourself (the architect role) ViewChannel + ReadMessageHistory on the category.");
  console.log("The bot will forward black hole messages to you via DM.");
}

// --- Main ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
  console.log(`[black-hole] Logged in as ${client.user?.tag}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error(`[black-hole] Guild not found: ${GUILD_ID}`);
    process.exit(1);
  }

  try {
    await setupBlackHole(guild);
  } catch (err) {
    console.error("[black-hole] Setup failed:", err);
  }

  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
