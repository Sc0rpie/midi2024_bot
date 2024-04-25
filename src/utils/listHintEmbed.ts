import { EmbedBuilder } from "discord.js";
import fs from "fs/promises";


// Function to create an embed of hints for a specified group
export async function generateHintEmbed(
  group: string | number,
  teamsJson: { teams: any[] },
  interaction: { user: { id: any } }
) {
  const locationsData = await fs.readFile("./src/data/locations.json");
  const locationsJson = JSON.parse(locationsData.toString());

  const userTeam = teamsJson.teams.find(
    (team: { owner_id: any }) => team.owner_id === interaction.user.id
  );

  const embed = new EmbedBuilder()
    .setTitle(`Hints for ${group}`)
    .setColor(0x0099ff);

  const locations = locationsJson[group].locations;
  locations.forEach((location: { id: any; hint: any }, index: number) => {
    const status = userTeam.locations_found.includes(location.id)
      ? `✅ - Completed`
      : userTeam.current_hints.includes(location.id)
      ? `❓ - ${location.hint}`
      : `❌ - ???`;
    embed.addFields({
      name: `Hint ${index + 1}`,
      value: status,
      inline: false,
    });
  });

  return embed;
}
