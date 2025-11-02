// commands/register.js
import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
  } from "discord.js";
  
  export const data = new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your IGN and class.");
  
  export async function execute(interaction) {
    // Step 1 — Ask IGN in modal
    const modal = new ModalBuilder()
      .setCustomId("registerModal")
      .setTitle("IGN Registration");
  
    const ignInput = new TextInputBuilder()
      .setCustomId("ignInput")
      .setLabel("Enter your IGN")
      .setPlaceholder("e.g., WalangHeal")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);
  
    const firstRow = new ActionRowBuilder().addComponents(ignInput);
    modal.addComponents(firstRow);
  
    await interaction.showModal(modal);
  
    // Wait for modal submission
    const submitted = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === "registerModal" && i.user.id === interaction.user.id,
      time: 60000,
    });
  
    const ign = submitted.fields.getTextInputValue("ignInput");
  
    // Step 2 — Send class selection buttons (ephemeral)
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Select Your Class")
      .setDescription(
        `IGN: **${ign}**\n\nClick a button below to choose your class:`
      );
  
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`class_Berserker_${ign}`)
        .setLabel("Berserker")
        .setEmoji("🪓")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`class_Warlord_${ign}`)
        .setLabel("Warlord")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`class_Archer_${ign}`)
        .setLabel("Archer")
        .setEmoji("🏹")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`class_Skald_${ign}`)
        .setLabel("Skald")
        .setEmoji("🎵")
        .setStyle(ButtonStyle.Primary)
    );
  
    await submitted.reply({
      embeds: [embed],
      components: [buttons],
      flags: MessageFlags.Ephemeral, // only the user sees this
    });
  }
  