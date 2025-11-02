// index.js
import {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
  } from "discord.js";
  import dotenv from "dotenv";
  import fs from "fs";
import path from "path";
import http from "http";
import {
    getCanonicalIgn,
    isIgnAvailable,
    setRegistration,
  } from "./utils/registrationStore.js";
  
  dotenv.config();
  
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });
  
  client.commands = new Collection();
  
  // --- LOAD COMMANDS ---
  const commands = [];
  const commandsPath = path.resolve("./commands");
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
  
  // --- REGISTER SLASH COMMANDS (guild-only for instant load) ---
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("🔄 Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("✅ Slash commands registered for this guild!");
  } catch (err) {
    console.error("❌ Error registering commands:", err);
  }
  
  // --- BOT READY ---
  client.once(Events.ClientReady, (c) => {
    console.log(`✅ Logged in as ${c.user.tag}`);
  });
  
  // --- HANDLE INTERACTIONS ---
  client.on(Events.InteractionCreate, async (interaction) => {
    // Command handler
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
    }
  
    // Button handler
    if (interaction.isButton()) {
      const [prefix, className, ...ignParts] = interaction.customId.split("_");
      if (prefix !== "class" || !className || ignParts.length === 0) {
        return;
      }

      const ign = ignParts.join("_");

      await interaction.deferUpdate();

      const trimmedIgn = ign.trim();
      const canonicalIgn = getCanonicalIgn(trimmedIgn);

      if (!canonicalIgn) {
        await interaction.followUp({
          content: "⚠️ That IGN is not on the approved list.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (!isIgnAvailable(canonicalIgn, interaction.user.id)) {
        await interaction.followUp({
          content: `⚠️ ${canonicalIgn} is already registered.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      let member;
      try {
        member = await interaction.guild.members.fetch(interaction.user.id);
      } catch {
        await interaction.followUp({
          content: "⚠️ I couldn’t find your member profile. Please try again in a moment.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const newNick = `[${className}] ${canonicalIgn}`;

      try {
        await member.setNickname(newNick);
      } catch {
        await interaction.followUp({
          content: "⚠️ I couldn’t change your nickname. Please check my permissions.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      try {
        setRegistration(canonicalIgn, {
          userId: interaction.user.id,
          className,
        });
      } catch (error) {
        console.error("❌ Failed to persist registration:", error);
        await interaction.followUp({
          content:
            "⚠️ I updated your nickname but couldn't save the registration. Please contact an officer.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const memberRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "member"
      );
      if (memberRole) {
        await member.roles.add(memberRole).catch(() => {});
      }

      await interaction.followUp({
        content: `🎉 You are now registered as **${newNick}**!`,
        flags: MessageFlags.Ephemeral,
      });

      await interaction
        .editReply({
          content: " ",
          embeds: [],
          components: [],
        })
        .catch(() => {});

      await interaction.deleteReply().catch(async () => {
        if (interaction.message?.deletable) {
          await interaction.message.delete().catch(() => {});
        }
      });
    }
  });
  
client.login(process.env.TOKEN);

const port = process.env.PORT || 3000;
http
  .createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running\n");
  })
  .listen(port, () => {
    console.log(`🌐 Healthcheck server listening on port ${port}`);
  });
  