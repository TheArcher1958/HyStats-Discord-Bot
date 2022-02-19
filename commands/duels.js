const { SlashCommandBuilder } = require('@discordjs/builders');
var Discord = require('discord.js');
var parent = require('../index.js');

const gamemodeName = "Duels";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('duels')
		.setDescription('Returns ' + gamemodeName + ' stats for a specified user')
		.addStringOption(option =>
		option.setName('username')
			.setDescription('The username you want to request stats for')
			.setRequired(true)),
	async execute(interaction) {
		let username = interaction.options.getString('username');
		let embed = await parent.getGeneralStatsWithFourCategories("duels", username);
		const selectRow = new Discord.MessageActionRow()
			.addComponents(
				new Discord.MessageSelectMenu()
					.setCustomId('gamemode')
					.addOptions([
						{
							label: 'General',
							value: `${username}:duels:`,
							default: true,
						},
						{
							label: 'Classic 1v1',
							value: `${username}:duels:classic`,
						},
						{
							label: 'UHC 1v1',
							value: `${username}:duels:uhc_1v1`,
						},
						{
							label: 'UHC 2v2',
							value: `${username}:duels:uhc_2v2`,
						},
						{
							label: 'UHC 4v4',
							value: `${username}:duels:uhc_4v4`,
						},
						{
							label: 'SW 1v1',
							value: `${username}:duels:sw_1v1`,
						},
						{
							label: 'SW 2v2',
							value: `${username}:duels:sw_2v2`,
						},
						{
							label: 'Sumo',
							value: `${username}:duels:sumo`,
						},
					]),
			);
		await interaction.reply({ embeds: [ embed ], components: [selectRow]});
	},
};