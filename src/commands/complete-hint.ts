import {CommandInteraction, SlashCommandBuilder, ChannelType, PermissionFlags, PermissionsBitField} from "discord.js";

import fs from "fs/promises";
import {Location, Team, Teams} from "./types";

// get_hints (groupnum)
/*
  Points: 10
  Unlocked groups: group1, group3
  1 - ???
  2 - ? hint
  3 - 10 - ivykdytas (hint)
  4 - ???
  5 - ???
 */

export const data = new SlashCommandBuilder()
    .setName('complete_hint')
    .setDescription('Completes a hint for a specific user')
    .addMentionableOption(option => option.setName('user').setDescription('User that completed a hint').setRequired(true))
    .addStringOption(option => option.setName('hint-id').setDescription('ID of a completed hint').setRequired(true))

export async function execute(interaction: CommandInteraction) {
    const userId = interaction.options.data[0].value as string;
    const id = interaction.options.data[1].value as string;
    const group = id.split('_')[0];

    const member = await interaction.guild?.members.cache.get(interaction.user.id);

    const hasSpecificRole = member?.roles.cache.has('1232411354359533618')

    if (!hasSpecificRole) {
        return interaction.reply({ content: "You do not have the required role to perform this action.", ephemeral: true });
    }   

    try {
        const locationsData = await fs.readFile("./src/data/locations.json");
        const locationsJson = JSON.parse(locationsData.toString());

        if (!(group in locationsJson) || !locationsJson[group].locations.some((location: Location) => location.id === id)) {
            return interaction.reply({ content: "Hint with such ID does not exist", ephemeral: true });
        }

        const teamsData = await fs.readFile("./src/data/teams.json");
        const teamsJson: Teams = JSON.parse(teamsData.toString());
        const userTeam = teamsJson.teams.find((team: Team) => team.owner_id === userId);

        if (!userTeam) {
            return interaction.reply({ content: "User does not have a team", ephemeral: true });
        }

        if (!userTeam.current_hints.includes(id)) {
            return interaction.reply({ content: "User does not have this hint unlocked", ephemeral: true });
        }

        // Update current hints and locations found
        userTeam.current_hints = userTeam.current_hints.filter(hint => hint !== id);
        userTeam.locations_found.push(id);

        // Determine if the group is exactly halfway completed
        const groupCompletedCount = userTeam.locations_found.filter(loc => loc.startsWith(group)).length;
        const groupTotalHints = locationsJson[group].locations.length;
        const exactlyHalfway = groupCompletedCount === Math.ceil(groupTotalHints / 2);

        const availableHintsInGroup = locationsJson[group].locations.filter((loc: Location) => !userTeam.locations_found.includes(loc.id));
        let nextHint = availableHintsInGroup.length > 0 ? availableHintsInGroup[Math.floor(Math.random() * availableHintsInGroup.length)] : null;
        if (nextHint) {
            userTeam.current_hints.push(nextHint.id);
        }

        let extraHint = null;
        if (exactlyHalfway) {
            const otherGroups = Object.keys(locationsJson).filter(g => g !== group && !userTeam.unlocked_groups.includes(g));
            if (otherGroups.length > 0) {
                const nextGroup = otherGroups[0]; // Assuming a specific selection logic for new group
                const availableHintsInNextGroup = locationsJson[nextGroup].locations.filter((loc: Location) => !userTeam.locations_found.includes(loc.id));
                if (availableHintsInNextGroup.length > 0) {
                    extraHint = availableHintsInNextGroup[Math.floor(Math.random() * availableHintsInNextGroup.length)];
                    userTeam.current_hints.push(extraHint.id);
                    if (!userTeam.unlocked_groups.includes(nextGroup)) {
                        userTeam.unlocked_groups.push(nextGroup);
                    }
                }
            }
        }

        // Save the updated data
        await fs.writeFile("./src/data/teams.json", JSON.stringify(teamsJson));

        // Construct reply
        let replyContent = `Hint ${id} marked as completed. Next hint: ${nextHint ? nextHint.hint : 'No more hints available in this group.'}`;
        if (extraHint) {
            replyContent += ` Additional hint from new group: ${extraHint.hint}`;
        }

        return interaction.reply({ content: replyContent, ephemeral: true });

    } catch (ex) {
        console.error(ex);
        return interaction.reply({ content: "An error has occurred while processing your request", ephemeral: true });
    }
}