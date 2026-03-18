/**
 * Rebuilds Floor 2 — THE HOLLOW with full channel structure
 * for the Deer Hollow recovery community.
 *
 * Run with: npx tsx bot/rebuild-hollow.ts
 */

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  ForumChannel,
} from "discord.js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;

const NEW_CHANNELS = [
  // Safety & orientation
  { name: "the-clearing", type: ChannelType.GuildText, topic: "Start here. Safety info, crisis resources, and what this floor is." },
  // Community
  { name: "the-campfire", type: ChannelType.GuildText, topic: "General hangout. Say what you need to say." },
  { name: "check-in", type: ChannelType.GuildText, topic: "How are you today, honestly." },
  { name: "wins", type: ChannelType.GuildText, topic: "Progress. Milestones. Good days. They count." },
  // Modality rooms
  { name: "cpt", type: ChannelType.GuildText, topic: "Cognitive Processing Therapy — the worksheets, the stuck points, the breakthroughs." },
  { name: "emdr", type: ChannelType.GuildText, topic: "Eye Movement Desensitization & Reprocessing — processing work." },
  { name: "parts-work", type: ChannelType.GuildText, topic: "Internal Family Systems — exiles, managers, firefighters. The parts that need to be heard." },
  { name: "dbt-skills", type: ChannelType.GuildText, topic: "Dialectical Behavior Therapy — distress tolerance, emotional regulation, skills practice." },
  { name: "the-stage", type: ChannelType.GuildText, topic: "Psychodrama. The scenes that needed to be replayed differently." },
  { name: "mind-body", type: ChannelType.GuildText, topic: "Mind-Body Bridging, somatic work, self-compassion, shame resilience." },
  // Forum for threads
  { name: "the-forum", type: ChannelType.GuildForum, topic: "Start a thread about anything. This is your space." },
  // Resources & heavier stuff
  { name: "resources", type: ChannelType.GuildText, topic: "Books, tools, links, program info." },
  { name: "the-back-room", type: ChannelType.GuildText, topic: "Heavier conversations. Quieter room. Still held." },
] as const;

const SAFETY_MESSAGE = `# Welcome to The Hollow

This floor exists because we met somewhere that mattered.

It's a place to stay connected — peer to peer, human to human. Not a replacement for treatment. Not a crisis line. Not a therapist's office. Just a campfire with people who get it.

**If you are in crisis or feeling unsafe, please reach out to people trained for exactly that:**

> 🟢 **Veterans Crisis Line:** Call **988** (press 1) · Text **838255**
> 🟢 **Crisis Text Line:** Text **HELLO** to **741741**
> 🟢 **988 Suicide & Crisis Lifeline:** Call or text **988**

You are not weak for using them. That's what they're there for.

**House rules for this floor:**
- Be honest. Be kind. Don't try to be someone's therapist.
- Share your experience, not your advice (unless asked).
- What's said on this floor stays on this floor.
- If someone shares something that worries you, DM Bret. Don't carry it alone.

We're peers here. That's enough.`;

async function rebuild() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(TOKEN);
  console.log(`Logged in as ${client.user?.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);

  // Find the Floor 2 category
  const allChannels = await guild.channels.fetch();
  const category = allChannels.find(
    (c) =>
      c?.type === ChannelType.GuildCategory &&
      c.name.includes("FLOOR 2")
  );

  if (!category) {
    console.error("Floor 2 category not found! Run setup-server.ts first.");
    client.destroy();
    process.exit(1);
  }

  console.log(`Found category: ${category.name} (${category.id})`);

  // Delete existing channels under Floor 2
  const existingChannels = allChannels.filter(
    (c) => c?.parentId === category.id
  );
  console.log(`\nDeleting ${existingChannels.size} old channels...`);
  for (const [, channel] of existingChannels) {
    if (channel) {
      console.log(`  Deleting #${channel.name}`);
      await channel.delete("Rebuilding Floor 2 — The Hollow");
    }
  }

  // Find the floor-2-hollow role for permissions
  const floorRole = guild.roles.cache.find((r) => r.name === "floor-2-hollow");
  if (!floorRole) {
    console.error("floor-2-hollow role not found!");
    client.destroy();
    process.exit(1);
  }

  // Create new channels
  console.log("\nCreating new channels...");
  let clearingChannel = null;

  for (const ch of NEW_CHANNELS) {
    const created = await guild.channels.create({
      name: ch.name,
      type: ch.type,
      parent: category.id,
      topic: ch.topic,
      reason: "Rebuilding Floor 2 — The Hollow for Deer Hollow community",
    });
    console.log(`  Created ${ch.type === ChannelType.GuildForum ? "forum" : "channel"}: #${ch.name}`);

    if (ch.name === "the-clearing") {
      clearingChannel = created;
    }
  }

  // Post safety message in #the-clearing
  if (clearingChannel && clearingChannel.type === ChannelType.GuildText) {
    const msg = await clearingChannel.send(SAFETY_MESSAGE);
    await msg.pin();
    console.log("\n  Pinned safety message in #the-clearing");
  }

  console.log("\n✓ Floor 2 — THE HOLLOW rebuilt successfully.");
  console.log(`  ${NEW_CHANNELS.length} channels created.`);
  client.destroy();
  process.exit(0);
}

rebuild().catch((err) => {
  console.error("Rebuild failed:", err);
  process.exit(1);
});
