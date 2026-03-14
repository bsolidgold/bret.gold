/**
 * One-time setup script: creates all floors (categories + channels),
 * roles, and permissions in the GOLD Discord server.
 *
 * Run with: npx tsx bot/setup-server.ts
 */

import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type Role,
} from "discord.js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;

// Floor definitions with their channels
const FLOOR_CONFIG = [
  {
    name: "FLOOR 0 — THE LOBBY",
    role: null, // everyone
    channels: ["welcome-mat", "bulletin-board", "graffiti-wall", "proof-of-life"],
  },
  {
    name: "FLOOR 1 — THE LIVING ROOM",
    role: "floor-1-living-room",
    channels: ["the-couch", "junk-drawer"],
  },
  {
    name: "FLOOR 2 — THE HOLLOW",
    role: "floor-2-hollow",
    channels: [
      "the-clearing", "the-campfire", "check-in", "wins",
      "cpt", "emdr", "parts-work", "dbt-skills",
      "the-stable", "the-stage", "mind-body",
      "the-well", "cravings", "milestones", "triggers",
      "the-forum", "resources", "the-back-room",
    ],
  },
  {
    name: "FLOOR 3 — THE DOJO",
    role: "floor-3-dojo",
    channels: ["the-mat", "tape-study", "tournament-dispatch", "open-mat-signal"],
  },
  {
    name: "FLOOR 4 — THE OFFICE",
    role: "floor-4-office",
    channels: ["the-desk", "water-cooler", "conference-room"],
  },
  {
    name: "FLOOR 5 — THE TERMINAL",
    role: "floor-5-terminal",
    channels: ["stdout", "stderr", "pull-requests", "dev-log"],
  },
  {
    name: "FLOOR 6 — THE STUDY",
    role: "floor-6-study",
    channels: ["the-desk-lamp", "drafts-and-fragments", "published"],
  },
  {
    name: "FLOOR 7 — THE OLD WING",
    role: "floor-7-old-wing",
    channels: ["time-capsule", "remember-when"],
  },
  {
    name: "FLOOR 8 — THE NEW WING",
    role: "floor-8-new-wing",
    channels: ["the-foyer", "the-courtyard"],
  },
  {
    name: "FLOOR 9 — THE FRONT DESK",
    role: "floor-9-front-desk",
    channels: ["inquiries", "portfolio-window"],
  },
  {
    name: "FLOOR 10 — THE GYM",
    role: "floor-10-gym",
    channels: ["weight-room", "the-kitchen", "the-sauna"],
  },
  {
    name: "FLOOR 11 — THE GALLERY",
    role: "floor-11-gallery",
    channels: ["now-playing", "the-darkroom", "the-mixtape"],
  },
  {
    name: "FLOOR 12 — THE CHAPEL",
    role: "floor-12-chapel",
    channels: ["the-altar", "the-question", "the-practice"],
  },
  {
    name: "FLOOR 13 — THE ROOFTOP",
    role: "floor-13-rooftop",
    channels: ["the-rooftop", "the-edge"],
  },
  {
    name: "FLOOR B — THE BASEMENT",
    role: "floor-b-basement",
    channels: ["server-logs", "bot-workshop"],
  },
];

// Archetype roles (cosmetic, no permissions)
const ARCHETYPE_ROLES = [
  "The Architect",
  "The Poet",
  "The Fighter",
  "The Wanderer",
  "The Keeper",
  "The Healer",
  "The Conductor",
  "The Ghost",
  "The Operator",
  "The Monk",
];

// Special roles
const SPECIAL_ROLES = [
  { name: "architect", color: 0xc9a84c }, // Bret - gold
  { name: "resident", color: 0x4a4a4a },
  { name: "new-arrival", color: 0x2d2d2d },
];

async function setup() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  await client.login(TOKEN);
  console.log(`Logged in as ${client.user?.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  console.log(`Setting up server: ${guild.name}`);

  // Create special roles first
  console.log("\n--- Creating special roles ---");
  for (const role of SPECIAL_ROLES) {
    const existing = guild.roles.cache.find((r) => r.name === role.name);
    if (existing) {
      console.log(`  Role "${role.name}" already exists`);
    } else {
      await guild.roles.create({
        name: role.name,
        color: role.color,
        hoist: true,
        reason: "GOLD server setup",
      });
      console.log(`  Created role: ${role.name}`);
    }
  }

  // Create archetype roles (cosmetic)
  console.log("\n--- Creating archetype roles ---");
  for (const name of ARCHETYPE_ROLES) {
    const existing = guild.roles.cache.find((r) => r.name === name);
    if (existing) {
      console.log(`  Role "${name}" already exists`);
    } else {
      await guild.roles.create({
        name,
        color: 0xc9a84c,
        hoist: false,
        reason: "GOLD server setup - archetype",
      });
      console.log(`  Created archetype role: ${name}`);
    }
  }

  // Create floor roles and channels
  console.log("\n--- Creating floors ---");
  const everyoneRole = guild.roles.everyone;

  for (const floor of FLOOR_CONFIG) {
    console.log(`\n  ${floor.name}`);

    // Create the floor role (if it has one)
    let floorRole: Role | null = null;
    if (floor.role) {
      const existing = guild.roles.cache.find((r) => r.name === floor.role);
      if (existing) {
        floorRole = existing;
        console.log(`    Role "${floor.role}" already exists`);
      } else {
        floorRole = await guild.roles.create({
          name: floor.role,
          reason: "GOLD server setup",
        });
        console.log(`    Created role: ${floor.role}`);
      }
    }

    // Create category
    let category = guild.channels.cache.find(
      (c) => c.name === floor.name && c.type === ChannelType.GuildCategory
    );
    if (!category) {
      const permissionOverwrites = floor.role
        ? [
            {
              id: everyoneRole.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: floorRole!.id,
              allow: [PermissionFlagsBits.ViewChannel],
            },
          ]
        : []; // Lobby is visible to everyone

      category = await guild.channels.create({
        name: floor.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites,
        reason: "GOLD server setup",
      });
      console.log(`    Created category: ${floor.name}`);
    } else {
      console.log(`    Category "${floor.name}" already exists`);
    }

    // Create channels under category
    for (const channelName of floor.channels) {
      const existing = guild.channels.cache.find(
        (c) => c.name === channelName && c.parentId === category!.id
      );
      if (existing) {
        console.log(`    Channel #${channelName} already exists`);
      } else {
        await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: "GOLD server setup",
        });
        console.log(`    Created channel: #${channelName}`);
      }
    }
  }

  console.log("\n\nServer setup complete.");
  console.log("Floor roles created — assign 'architect' role to yourself manually.");
  client.destroy();
  process.exit(0);
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
