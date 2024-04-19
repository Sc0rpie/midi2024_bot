import {CommandInteraction, SlashCommandBuilder} from "discord.js";

import fs from "fs/promises";

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
    .setName('create_team')
    .setDescription('Creates a team with a specified name')
    .addStringOption(option => option.setName('team-name').setDescription('Team name').setRequired(true))

type Team = {
    owner_id: string;
    team_name: string;
    points: number;
    locations_found: Array<string>;
    unlocked_groups: Array<string>;
    current_hints: Array<string>;
}

type Teams = {
    teams: Array<Team>
}

type Location = {
    id: string;
    name: string;
    points: number;
    hint: string;
    answer: string;
}

type Group = {
    locations: Array<Location>;
    amount_of_locations: number;
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

            fs.readFile("./src/data/locations.json")
                .then((data) => {
                    const locationsJson = JSON.parse(data.toString())
                    const randomLocation = Math.floor(Math.random() * locationsJson[randomGroup].amount_of_locations as number)

                    console.log(locationsJson[randomGroup].locations[randomLocation].hint)

                    jsonData.teams.push({
                        owner_id: interaction.user.id,
                        team_name: interaction.options.data[0].value as string,
                        points: 0,
                        locations_found: [],
                        unlocked_groups: [ randomGroup ],
                        current_hints: [ `${randomGroup}_${randomLocation + 1}` ]
                    })

                    fs.writeFile("./src/data/teams.json", JSON.stringify(jsonData))
                        .then(() => {
                            return interaction.reply({ content: "Created a team", ephemeral: true })
                        })
                        .catch((ex) => {
                            console.log(ex)
                            return interaction.reply({ content: "An error has occured while creating a team", ephemeral: true })
                        })
                })
        })
        .catch((ex) => {
            console.log(ex)
            console.log("Couldn't read teams.json")
            return interaction.reply({ content: "An error has occured while creating a team", ephemeral: true })
        })
}