import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Displays the leaderboard of the top 25 teams");

import fs from "fs/promises";

export async function execute(interaction: CommandInteraction) {
  try {
    const teamsData = await fs.readFile("./src/data/teams.json");
    const teamsJson = JSON.parse(teamsData.toString());

    // Sorting teams based on points in descending order
    const sortedTeams = teamsJson.teams
      .sort(
        (a: { points: number }, b: { points: number }) => b.points - a.points
      )
      .slice(0, 25);

    const embed = new EmbedBuilder().setTitle("Leaderboard").setColor(0x00ae86); // You can choose whatever color you prefer

    // Adding fields to the embed for each team
    sortedTeams.forEach(
      (team: { team_name: any; points: any }, index: number) => {
        embed.addFields({
          name: `${index + 1}. ${team.team_name}`,
          value: `${team.points} points`,
          inline: false,
        });
      }
    );

    await interaction.reply({ embeds: [embed] });
  } catch (ex) {
    console.error("Failed to read teams data:", ex);
    await interaction.reply({
      content: "Failed to load the leaderboard.",
      ephemeral: true,
    });
  }
}
