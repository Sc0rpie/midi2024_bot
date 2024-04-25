import {
  CommandInteraction,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlags,
  PermissionsBitField,
  EmbedBuilder,
} from "discord.js";
import fs from "fs/promises";
import { Location, Team, Teams } from "./types";
import { generateHintEmbed } from "../utils/listHintEmbed";

export const data = new SlashCommandBuilder()
  .setName("complete_hint")
  .setDescription("Completes a hint for a specific user")
  .addMentionableOption((option) =>
    option
      .setName("user")
      .setDescription("User that completed a hint")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("hint-id")
      .setDescription("ID of a completed hint")
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const userId = interaction.options.data[0].value as string;
  const id = interaction.options.data[1].value as string;
  const group = id.split("_")[0];

  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const hasSpecificRole = member?.roles.cache.has("1232411354359533618");

  if (!hasSpecificRole) {
    return interaction.reply({
      content: "You do not have the required role to perform this action.",
      ephemeral: true,
    });
  }

  try {
    const locationsData = await fs.readFile("./src/data/locations.json");
    const locationsJson = JSON.parse(locationsData.toString());

    if (
      !(group in locationsJson) ||
      !locationsJson[group].locations.some(
        (location: { id: string }) => location.id === id
      )
    ) {
      return interaction.reply({
        content: "Hint with such ID does not exist",
        ephemeral: true,
      });
    }

    const teamsData = await fs.readFile("./src/data/teams.json");
    const teamsJson: Teams = JSON.parse(teamsData.toString());
    const userTeam = teamsJson.teams.find((team) => team.owner_id === userId);

    if (!userTeam) {
      return interaction.reply({
        content: "User does not have a team",
        ephemeral: true,
      });
    }

    if (!userTeam.current_hints.includes(id)) {
      return interaction.reply({
        content: "User does not have this hint unlocked",
        ephemeral: true,
      });
    }

    // Update current hints and locations found
    userTeam.current_hints = userTeam.current_hints.filter(
      (hint) => hint !== id
    );
    userTeam.locations_found.push(id);
    userTeam.points += locationsJson[group].locations.find(
      (location: { id: string }) => location.id === id
    ).points;

    const allHints = [...userTeam.current_hints, ...userTeam.locations_found]; // Combined list of all known hints

    // Determine if the group is exactly halfway completed
    const groupCompletedCount = userTeam.locations_found.filter((loc) =>
      loc.startsWith(group)
    ).length;
    const groupTotalHints = locationsJson[group].locations.length;
    const exactlyHalfway =
      groupCompletedCount === Math.ceil(groupTotalHints / 2);

    // Select next hint ensuring no duplicates
    let availableHintsInGroup = locationsJson[group].locations.filter(
      (loc: { id: string }) => !allHints.includes(loc.id)
    );
    let nextHint =
      availableHintsInGroup.length > 0
        ? availableHintsInGroup[
            Math.floor(Math.random() * availableHintsInGroup.length)
          ]
        : null;

    if (nextHint) {
      userTeam.current_hints.push(nextHint.id);
      allHints.push(nextHint.id); // Update combined hints list
    }

    let extraHint = null;
    if (exactlyHalfway) {
      const otherGroups = Object.keys(locationsJson).filter(
        (g) => g !== group && !userTeam.unlocked_groups.includes(g)
      );
      if (otherGroups.length > 0) {
        const nextGroup = otherGroups[0];
        availableHintsInGroup = locationsJson[nextGroup].locations.filter(
          (loc: { id: string }) => !allHints.includes(loc.id)
        );
        if (availableHintsInGroup.length > 0) {
          extraHint =
            availableHintsInGroup[
              Math.floor(Math.random() * availableHintsInGroup.length)
            ];
          userTeam.current_hints.push(extraHint.id);
          console.log(extraHint);
          if (!userTeam.unlocked_groups.includes(nextGroup)) {
            userTeam.unlocked_groups.push(nextGroup);
          }
        }
      }
    }

    // Save the updated data
    await fs.writeFile(
      "./src/data/teams.json",
      JSON.stringify(teamsJson, null, 4)
    );

    // Construct reply
    const embed = await generateHintEmbed(group, teamsJson, interaction);

    // Append notifications to reply if applicable
    let notifications = "";
    if (nextHint) {
      notifications += `New hint available: ${nextHint.hint}\n`;
    }

    const notifEmbed = new EmbedBuilder()
        .setTitle("Notifications")
        .setColor(0x00ae86);
    if (extraHint) {
      
      notifEmbed.addFields({
        name: "New group!",
        value: `You have unlocked a new group - ${extraHint.id.split("_")[0]}`,
        inline: false,
      });
      return interaction.reply({embeds: [notifEmbed, embed] });
      // notifications += `New group unlocked: ${extraHint.id.split("_")[0]}`;
    }
    return interaction.reply({content: notifications, embeds: [embed]});
  } catch (ex) {
    console.error(ex);
    return interaction.reply({
      content: "An error has occurred while processing your request",
      ephemeral: true,
    });
  }
}
