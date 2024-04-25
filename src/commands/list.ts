import {
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  APIEmbedField,
} from "discord.js";
import fs from "fs/promises";

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("List all hints for a specific group")
  .addStringOption((option) =>
    option
      .setName("group")
      .setDescription("The group to list hints from")
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const group = interaction.options.data[0].value as string;

  const groupName = group.replace(/[0-9]/g, ""); // Removes digits
  const groupNumber = group.replace(/\D/g, ""); // Removes non-digits
  const locationsData = await fs.readFile("./src/data/locations.json");
  const locationsJson = JSON.parse(locationsData.toString());
  const teamsData = await fs.readFile("./src/data/teams.json");
  const teamsJson = JSON.parse(teamsData.toString());

  const userTeam = teamsJson.teams.find(
    (team: { owner_id: string }) => team.owner_id === interaction.user.id
  );
  if (!userTeam) {
    return interaction.reply({
      content: "User does not have a team",
      ephemeral: true,
    });
  }

  if (
    !locationsJson.hasOwnProperty(group) ||
    !userTeam.unlocked_groups.includes(group)
  ) {
    return interaction.reply({
      content: "Invalid group or group not unlocked",
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`Hints for ${groupName} ${groupNumber}`)
    .setColor(0x0099ff);

  const locations = locationsJson[group].locations;
  locations.forEach((location: { id: any; hint: any }, index: number) => {
    const status = userTeam.locations_found.includes(location.id)
      ? `✅ - Completed`
      : userTeam.current_hints.includes(location.id)
      ? `❓ - ${location.hint}`
      : `❌ - ???`;
    // Set inline to false to ensure each hint appears on its own line
    embed.addFields({
      name: `Hint ${index + 1}`,
      value: status,
      inline: false,
    });
  });

  await interaction.reply({ embeds: [embed] });
}