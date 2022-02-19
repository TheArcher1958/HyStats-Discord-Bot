const { SlashCommandBuilder } = require('@discordjs/builders');
var Discord = require('discord.js');
var parent = require('../index.js');

const gamemodeName = "SkyWars";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sw')
		.setDescription('Returns ' + gamemodeName + ' stats for a specified user')
		.addStringOption(option =>
		option.setName('username')
			.setDescription('The username you want to request stats for')
			.setRequired(true)),
	async execute(interaction) {
		let username = interaction.options.getString('username');
		let embed = await parent.getGeneralStatsWithFourCategories("skywars", username);
		const selectRow = new Discord.MessageActionRow()
			.addComponents(
				new Discord.MessageSelectMenu()
					.setCustomId('gamemode')
					.addOptions([
						{
							label: 'General',
							value: `${username}:skywars:`,
							default: true,
						},
						{
							label: 'Ranked',
							value: `${username}:skywars:ranked`,
						},
						{
							label: 'Solo Normal',
							value: `${username}:skywars:solo_normal`,
						},
						{
							label: 'Solo Insane',
							value: `${username}:skywars:solo_insane`,
						},
						{
							label: 'Team Normal',
							value: `${username}:skywars:team_normal`,
						},
						{
							label: 'Team Insane',
							value: `${username}:skywars:team_insane`,
						},
						{
							label: 'Mega Doubles',
							value: `${username}:skywars:mega_doubles`,
						},
						{
							label: 'Mega Normal',
							value: `${username}:skywars:mega_normal`,
						},
					]),
			);
		await interaction.reply({ embeds: [ embed ], components: [selectRow]});
	},
};