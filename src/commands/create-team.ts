import {CommandInteraction, SlashCommandBuilder, ChannelType, PermissionFlags, PermissionsBitField} from "discord.js";

import { Team, Teams, Location, Group } from './types'

import fs from "fs/promises";
import { generateHintEmbed } from "../utils/listHintEmbed";

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

export async function execute(interaction: CommandInteraction) {
    // for debug
    console.log(interaction.options.data[0])
    console.log(interaction.user.id)

    if ((interaction.options.data[0].value as string).length > 100) {
        return interaction.reply({ content: "Team name is too long", ephemeral: true })
    }

    // TODO Try/catch
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
                    const randomLocationNum = Math.floor(Math.random() * locationsJson[randomGroup].amount_of_locations as number)
                    const randomLocationId = `${randomGroup}_${randomLocationNum + 1}`

                    interaction.guild?.channels.create({
                        name: interaction.options.data[0].value as string,
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: PermissionsBitField.Flags.ViewChannel
                            },
                            {
                                id: interaction.user.id,
                                allow: PermissionsBitField.Flags.ViewChannel
                            }
                        ]
                    }).then(async (channel): Promise<void> => {
                        jsonData.teams.push({
                            owner_id: interaction.user.id,
                            team_name: interaction.options.data[0].value as string,
                            points: 0,
                            locations_found: [],
                            unlocked_groups: [ randomGroup ],
                            current_hints: [ randomLocationId ],
                            skips: [0, 0, 0, 0, 0, 0],
                            channel_id: channel.id
                        })

                        const embed = await generateHintEmbed(randomGroup, jsonData, interaction)
                        channel.send({ embeds: [embed] })
                        // channel.send({ content: `Your first hint: ${locationsJson[randomGroup].locations.filter((location: Location) => location.id == randomLocationId)[0].hint}`} )

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
        })
        
        .catch((ex) => {
            console.log(ex)
            console.log("Couldn't read teams.json")
            return interaction.reply({ content: "An error has occured while creating a team", ephemeral: true })
        })
    
    
}