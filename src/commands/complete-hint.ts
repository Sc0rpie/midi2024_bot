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
    // console.log(interaction.options.data[0].value)
    // console.log(interaction.options.data[1].value)

    const userId = interaction.options.data[0].value as string
    const id = interaction.options.data[1].value as string
    const group = id.split('_')[0]

    fs.readFile("./src/data/locations.json")
        .then((data) => {
            const locationsJson = JSON.parse(data.toString())
            const hintExists = locationsJson[group]?.locations.some((location: Location) => location.id === id) ?? false

            if (!hintExists)
                return interaction.reply({ content: "Hint with such ID does not exist", ephemeral: true })

            fs.readFile("./src/data/teams.json")
                .then((teamsData) => {
                    const teamsJson = JSON.parse(teamsData.toString())
                    const userHasATeam = teamsJson.teams.some((team: Team) => team.owner_id === userId) ?? false

                    if (!userHasATeam)
                        return interaction.reply({ content: "User does not have a team", ephemeral: true })

                    const userTeam: Team = teamsJson.teams.filter((team: Team) => team.owner_id === userId)[0]

                    const userHasHintUnlocked = userTeam.current_hints.some((hintId) => hintId === id)

                    if (!userHasHintUnlocked)
                        return interaction.reply({ content: "User does not have this hint unlocked", ephemeral: true })

                    const teamIndex: number = (teamsJson as Teams).teams.indexOf(userTeam);

                    (teamsJson as Teams).teams[teamIndex].current_hints = (teamsJson as Teams).teams[teamIndex].current_hints.filter((hintId) => hintId !== id);
                    (teamsJson as Teams).teams[teamIndex].locations_found.push(id)

                    fs.writeFile("./src/data/teams.json", JSON.stringify(teamsJson))
                        .then(() => {
                            return interaction.reply({ content: "Hint marked as completed", ephemeral: true })
                        })
                        .catch((ex) => {
                            console.log(ex)
                            return interaction.reply({ content: "An error has occured while marking a hint as completed", ephemeral: true })
                        })

                })
        })
}
