import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import fs from 'fs';
import { Team, Teams, Location } from './types';
import { generateHintEmbed } from "../utils/listHintEmbed";

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip location from a specific group')
    .addStringOption(option => option.setName('group').setDescription('Group to skip location from').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    const group = interaction.options.data[0].value as string;
    const validGroups = ['group1', 'group2', 'group3', 'group4', 'group5', 'group6'];
    const groupIndex = validGroups.indexOf(group);
    if (groupIndex === -1) {
        return interaction.reply({ content: "Invalid group", ephemeral: true });
    }

    const teamsData = await fs.promises.readFile("./src/data/teams.json");
    const teamsJson: Teams = JSON.parse(teamsData.toString());
    const userTeam = teamsJson.teams.find((team: Team) => team.owner_id === interaction.user.id);

    if (!userTeam) {
        return interaction.reply({ content: "User does not have a team", ephemeral: true });
    }

    if (!userTeam.unlocked_groups.includes(group)) {
        return interaction.reply({ content: "Group is not unlocked", ephemeral: true });
    }

    const locationsData = await fs.promises.readFile("./src/data/locations.json");
    const locationsJson = JSON.parse(locationsData.toString());
    const totalLocations = locationsJson[group].amount_of_locations;
    const maxSkipsAllowed = Math.floor(totalLocations / 2);

    if (userTeam.skips[groupIndex] >= maxSkipsAllowed) {
        return interaction.reply({ content: `You have reached the maximum skip limit of ${maxSkipsAllowed} for ${group}`, ephemeral: true });
    }

    // Prevent skipping if all hints are already known
    const knownLocations = new Set([...userTeam.current_hints, ...userTeam.locations_found]);
    const availableLocations = locationsJson[group].locations.filter((loc: { id: string; }) => !knownLocations.has(loc.id));
    if (availableLocations.length === 0) {
        return interaction.reply({ content: "No more hints available to skip in this group.", ephemeral: true });
    }

    userTeam.skips[groupIndex]++;
    const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    const randomLocationId = randomLocation.id;
    userTeam.current_hints.push(randomLocationId);

    // Serialize the modified teams JSON and write it back to the file
    await fs.promises.writeFile("./src/data/teams.json", JSON.stringify(teamsJson, null, 4));
    
    const embed = await generateHintEmbed(group, teamsJson, interaction);

    // Send the location hint to the user
    return interaction.reply({ embeds: [embed]});
}