/**
 * The Concierge — GOLD's bot.
 * Handles role assignment, approval flows, slash commands.
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
} from "discord.js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const GUILD_ID = process.env.DISCORD_GUILD_ID!;

// Floor metadata for display
const FLOORS: Record<string, { name: string; number: string; role: string }> = {
  "floor-1-living-room": { name: "THE LIVING ROOM", number: "1", role: "floor-1-living-room" },
  "floor-2-hollow": { name: "THE HOLLOW", number: "2", role: "floor-2-hollow" },
  "floor-3-dojo": { name: "THE DOJO", number: "3", role: "floor-3-dojo" },
  "floor-4-office": { name: "THE OFFICE", number: "4", role: "floor-4-office" },
  "floor-5-terminal": { name: "THE TERMINAL", number: "5", role: "floor-5-terminal" },
  "floor-6-study": { name: "THE STUDY", number: "6", role: "floor-6-study" },
  "floor-7-old-wing": { name: "THE OLD WING", number: "7", role: "floor-7-old-wing" },
  "floor-8-new-wing": { name: "THE NEW WING", number: "8", role: "floor-8-new-wing" },
  "floor-9-front-desk": { name: "THE FRONT DESK", number: "9", role: "floor-9-front-desk" },
  "floor-10-gym": { name: "THE GYM", number: "10", role: "floor-10-gym" },
  "floor-11-gallery": { name: "THE GALLERY", number: "11", role: "floor-11-gallery" },
  "floor-12-chapel": { name: "THE CHAPEL", number: "12", role: "floor-12-chapel" },
  "floor-b-basement": { name: "THE BASEMENT", number: "B", role: "floor-b-basement" },
};

// Auto-react rules: channel name -> emoji
const AUTO_REACTIONS: Record<string, string> = {
  "wins": "🏆",
  "proof-of-life": "👁️",
  "now-playing": "🎧",
  "open-mat-signal": "🤙",
  "check-in": "🫂",
  "published": "📖",
  "dev-log": "🚀",
  "milestones": "🕯️",
};

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
const floorChoices = Object.entries(FLOORS).map(([key, val]) => ({
  name: `Floor ${val.number} — ${val.name}`,
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
    .setDescription("Grant a user access to a floor (architect only) — alias for /approve")
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
      return info ? `  ${info.number.padStart(2)} │ ${info.name}` : null;
    })
    .filter(Boolean)
    .join("\n");

  await interaction.reply({
    content: `\`\`\`\nYOUR ACCESS\n${"─".repeat(30)}\n${floorList}\n\`\`\``,
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

  const embed = new EmbedBuilder()
    .setColor(0xc9a84c)
    .setTitle(`// ${interaction.user.username}`)
    .addFields(
      {
        name: "Archetype",
        value: archetype ? archetype.name : "Unassigned",
        inline: true,
      },
      {
        name: "Floors",
        value: String(floors.size),
        inline: true,
      }
    )
    .setFooter({ text: "The Building sees you." });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleBuilding(interaction: ChatInputCommandInteraction) {
  const directory = [
    " 0 │ THE LOBBY        │ open",
    " 1 │ THE LIVING ROOM  │ gated",
    " 2 │ THE HOLLOW       │ gated",
    " 3 │ THE DOJO         │ open",
    " 4 │ THE OFFICE       │ gated",
    " 5 │ THE TERMINAL     │ open",
    " 6 │ THE STUDY        │ gated",
    " 7 │ THE OLD WING     │ locked",
    " 8 │ THE NEW WING     │ open",
    " 9 │ THE FRONT DESK   │ open",
    "10 │ THE GYM          │ gated",
    "11 │ THE GALLERY      │ open",
    "12 │ THE CHAPEL       │ gated",
    " B │ THE BASEMENT     │ locked",
  ].join("\n");

  await interaction.reply({
    content: `\`\`\`\nTHE BUILDING\n${"═".repeat(38)}\n${directory}\n${"═".repeat(38)}\n13 floors. Each one a different part of a life.\n\`\`\``,
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
    content: `\`\`\`\nACCESS GRANTED\n${targetUser.username} → Floor ${info.number} — ${info.name}\n\`\`\``,
  });

  // DM the user
  await member.send({
    content: `\`\`\`\nACCESS GRANTED\nFloor ${info.number} — ${info.name}\n\nThe door is open.\n\`\`\``,
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
    content: `\`\`\`\nACCESS DENIED\n${targetUser.username} → Floor ${info?.number ?? "?"} — ${info?.name ?? floorKey}\n\`\`\``,
  });

  // DM the user
  const guild = await client.guilds.fetch(GUILD_ID);
  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  if (member) {
    await member.send({
      content: `\`\`\`\nACCESS DENIED\nFloor ${info?.number ?? "?"} — ${info?.name ?? floorKey}\n\nThe door remains closed. For now.\n\`\`\``,
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
    content: `\`\`\`\nACCESS REVOKED\n${targetUser.username} ✕ Floor ${info?.number ?? "?"} — ${info?.name ?? floorKey}\n\`\`\``,
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
        `**${username}** (${archetype}) is requesting access to **Floor ${info.number} — ${info.name}**.`
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
        content: `Approved **${member.user.username}** for Floor ${info?.number ?? "?"} — ${info?.name ?? roleName}.`,
        embeds: [],
        components: [],
      });

      // DM the user
      await member.send({
        content: `\`\`\`\nACCESS GRANTED\nFloor ${info?.number ?? "?"} — ${info?.name ?? roleName}\n\nThe door is open.\n\`\`\``,
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

// --- Event Listeners ---

client.on("ready", () => {
  console.log(`The Concierge is online as ${client.user?.tag}`);
  registerCommands();
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
    }
  } else if (interaction.isButton()) {
    await handleButton(interaction);
  }
});

// Auto-react to messages in specific channels
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const channelName = "name" in message.channel ? message.channel.name : "";
  const emoji = AUTO_REACTIONS[channelName];
  if (emoji) {
    await message.react(emoji).catch(() => {});
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

  // DM with nickname instructions
  await member.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xc9a84c)
        .setTitle("Welcome to The Building")
        .setDescription(
          "One thing — set your **server nickname** so people know who you are.\n\n" +
          "**How to do it:**\n" +
          "• **Desktop:** Click the server name at the top → *Edit Server Profile* → set your nickname\n" +
          "• **Mobile:** Tap the server name → *Edit Server Profile* → set your nickname\n\n" +
          "Use your real name, a name people know you by, or whatever you want to be called here."
        )
        .setFooter({ text: "The building remembers names." })
    ],
  }).catch(() => {});
});

client.login(TOKEN);
