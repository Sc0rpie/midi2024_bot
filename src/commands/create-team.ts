import {CommandInteraction, SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('create_team')
    .setDescription('Creates a team with a specified name')
    .addStringOption(option => option.setName('team-name').setDescription('Team name').setRequired(true))

export async function execute(interaction: CommandInteraction) {
    // for debug
    console.log(interaction.options.data[0])
    return interaction.reply({ content: "Added to team", ephemeral: true })
}