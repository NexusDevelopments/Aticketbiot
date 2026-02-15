import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  EmbedBuilder
} from "discord.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getSettings, prisma } from "./db.js";

let client;

async function registerCommands(token, clientId) {
  const rest = new REST({ version: "10" }).setToken(token);
  const commands = [
    {
      name: "help",
      description: "Get the ticket system link"
    },
    {
      name: "paswdgen",
      description: "Generate a website password for a user",
      options: [
        {
          name: "master_password",
          description: "Special password to authorize generation",
          type: 3,
          required: true
        }
      ]
    }
  ];

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
}

async function startBot({ token, clientId }) {
  if (client) return client;

  client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel]
  });

  client.on("ready", async () => {
    await registerCommands(token, clientId);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "help") {
      const settings = await getSettings();
      const websiteUrl = settings?.websiteUrl || "";
      const imageUrl = settings?.imageUrl || undefined;

      const embed = new EmbedBuilder()
        .setTitle("Ticket System")
        .setDescription(
          websiteUrl
            ? `Open the website to manage tickets and settings: ${websiteUrl}`
            : "Open the website to manage tickets and settings."
        )
        .setColor(0x2f6bff)
        .setThumbnail(imageUrl);

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (interaction.commandName === "paswdgen") {
      const userId = interaction.user.id;
      const masterPassword = interaction.options.getString(
        "master_password",
        true
      );

      const ownerId = process.env.OWNER_ID || "1435310225010987088";
      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          content: "Only the owner can run this command.",
          ephemeral: true
        });
        return;
      }

      const masterRaw = process.env.ADMIN_PASSWORD || "crxxr10032011";
      const masterHash = process.env.ADMIN_PASSWORD_HASH;
      const masterOk = masterHash
        ? await bcrypt.compare(masterPassword, masterHash)
        : masterPassword === masterRaw;

      if (!masterOk) {
        await interaction.reply({
          content: "Invalid master password.",
          ephemeral: true
        });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        await interaction.reply({
          content: "Your ID is not authorized in the panel.",
          ephemeral: true
        });
        return;
      }

      const rawPassword = crypto.randomBytes(9).toString("base64url");
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      await interaction.reply({
        content: "Password generated and DM sent.",
        ephemeral: true
      });

      const targetUser = await client.users.fetch(userId).catch(() => null);
      if (targetUser) {
        await targetUser.send(
          `Your website login password has been generated.\nUser ID: ${userId}\nPassword: ${rawPassword}`
        );
      }
    }
  });

  await client.login(token);

  return client;
}

async function stopBot() {
  if (!client) return;
  await client.destroy();
  client = null;
}

function isBotRunning() {
  return Boolean(client);
}

async function sendBotMessage({ channelId, message }) {
  if (!client) throw new Error("Bot not running");
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    throw new Error("Invalid channel");
  }
  await channel.send(message);
}

async function sendPasswordDM({ userId, password }) {
  if (!client) return false;
  const targetUser = await client.users.fetch(userId).catch(() => null);
  if (!targetUser) return false;
  await targetUser.send(
    `Your website login password has been generated.\nUser ID: ${userId}\nPassword: ${password}`
  );
  return true;
}

async function sendBlacklistEmbed({ userId, reason, duration }) {
  if (!client) return;

  const settings = await getSettings();
  const channelId = settings?.blacklistChannelId;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const user = await client.users.fetch(userId).catch(() => null);
  const username = user?.username || "Unknown User";
  const avatarUrl = user?.displayAvatarURL({ size: 256 }) || null;

  const embed = new EmbedBuilder()
    .setColor(0xff2f2f)
    .setTitle("Blacklisted")
    .setDescription(`${username}\n${reason}\n${duration}`)
    .setThumbnail(avatarUrl)
    .setFooter({ text: `User ID: ${userId}` });

  await channel.send({ embeds: [embed] });
}

export {
  startBot,
  stopBot,
  isBotRunning,
  sendBotMessage,
  sendPasswordDM,
  sendBlacklistEmbed
};
