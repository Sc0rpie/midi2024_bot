import {CommandInteraction, SlashCommandBuilder} from "discord.js";

import fs from "fs/promises";

export const data = new SlashCommandBuilder()
    .setName('create_team')
    .setDescription('Creates a team with a specified name')
    .addStringOption(option => option.setName('team-name').setDescription('Team name').setRequired(true))

type Team = {
    owner_id: string;
    team_name: string;
    points: number;
    locations_found: Array<string>;
    unlocked_groups: Array<string>;
}

type Teams = {
    teams: Array<Team>
}

export async function execute(interaction: CommandInteraction) {
    // for debug
    console.log(interaction.options.data[0])
    console.log(interaction.user.id)

    fs.readFile("./src/data/teams.json")
        .then((data) => {
            const jsonData: Teams = JSON.parse(data.toString())

            if (jsonData.teams.some((team) => team.owner_id == interaction.user.id)) {
                return interaction.reply({ content: "You already have a team", ephemeral: true })
            } else if (jsonData.teams.some((name) => name.team_name.trim().toLowerCase() == (interaction.options.data[0].value as string).trim().toLowerCase())) {
                return interaction.reply( { content: "This team name already exists", ephemeral: true })
            }

            const randomGroup = `group${Math.floor(Math.random() * 6) + 1}`

            jsonData.teams.push({
                owner_id: interaction.user.id,
                team_name: interaction.options.data[0].value as string,
                points: 0,
                locations_found: [],
                unlocked_groups: [ randomGroup ]
            })

            fs.writeFile("./src/data/teams.json", JSON.stringify(jsonData))
                .then(() => {
                    return interaction.reply({ content: "Created a team", ephemeral: true })
                })
                .catch(() => {
                    return interaction.reply({ content: "An error has occured while creating a team", ephemeral: true })
                })
        })
        .catch(() => {

            console.log("Couldn't read teams.json")
            return interaction.reply({ content: "An error has occured while creating a team", ephemeral: true })
        })
}