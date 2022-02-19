const { SlashCommandBuilder } = require('@discordjs/builders');
var Discord = require('discord.js');
var parent = require('../index.js');

const gamemodeName = "SkyWars";

function generateParamsWithTimeFrame(interaction, timeframe = "overall") {
	return params = {
			stat: interaction.options.getString('category'),
			detailed_mode: interaction.options.getString('gamemode'),
			gamemode: interaction.options.getSubcommand(),
			timeframe: timeframe
		}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lb')
		.setDescription('Returns leaderboard stats for a specific game mode')
		.addSubcommand(subcommand =>
		subcommand
			.setName('sw')
			.setDescription('Returns SkyWars leaderboards')
			.addStringOption(option =>
		option.setName('category')
			.setDescription('The stat you want to request a leaderboard for')
			.setRequired(true)
			.addChoice('K/D', 'kd')
			.addChoice('W/L', 'wl')
			.addChoice('Kills', 'kills')
			.addChoice('Wins', 'wins'))
			.addStringOption(option =>
		option.setName('gamemode')
			.setDescription('The SkyWars gamemode')
			.addChoice('General', 'general')
			.addChoice('Solo Normal', 'solo_normal')
			.addChoice('Solo Insane', 'solo_insane')
			.addChoice('Team Normal', 'team_normal')
			.addChoice('Team Insane', 'team_insane')
			.addChoice('Mega Normal', 'mega_normal')
			.addChoice('Mega Doubles', 'mega_doubles')))
	.addSubcommand(subcommand =>
		subcommand
			.setName('duels')
			.setDescription('Returns Duels leaderboards')
			.addStringOption(option =>
		option.setName('category')
			.setDescription('The stat you want to request a leaderboard for')
			.setRequired(true)
			.addChoice('K/D', 'kd')
			.addChoice('W/L', 'wl')
			.addChoice('Kills', 'kills')
			.addChoice('Wins', 'wins'))
			.addStringOption(option =>
			option.setName('gamemode')
			.setDescription('The Duels gamemode')
			.addChoice('General', 'general')
			.addChoice('Classic 1v1', 'classic')
			.addChoice('UHC 1v1', 'uhc_1v1')
			.addChoice('UHC 2v2', 'uhc_2v2')
			.addChoice('UHC 4v4', 'uhc_4v4')
			.addChoice('SW 1v1', 'sw_1v1')
			.addChoice('SW 2v2', 'sw_2v2')
			.addChoice('Sumo', 'sumo'))),
	async execute(interaction) {
		let params = generateParamsWithTimeFrame(interaction);
		let embed = await parent.getLBEmbed(params);
		const selectRow = new Discord.MessageActionRow()
			.addComponents(
				new Discord.MessageSelectMenu()
					.setCustomId('leaderboard')
					.addOptions([
						{
							label: 'Overall',
							value: `${JSON.stringify(params)}`,
							default: true,
						},
						{
							label: 'Daily',
							value: `${JSON.stringify(generateParamsWithTimeFrame(interaction, "daily"))}`,
						},
						{
							label: 'Weekly',
							value: `${JSON.stringify(generateParamsWithTimeFrame(interaction, "weekly"))}`,
						},
						{
							label: 'Monthly',
							value: `${JSON.stringify(generateParamsWithTimeFrame(interaction, "monthly"))}`,
						}
					]),
			);
		await interaction.reply({ embeds: [ embed ], components: [selectRow]});
	},
};