const fs = require('fs');
const https = require('https');
const http = require('http');
const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]
});
const rootURL = "https://hystats.net/";
const playerPath = "player/";
const {
    API_KEY,
    token
} = require('./config.json');


var GamemodeStats = function(kd, wl, wins, kills, xp, losses, deaths) {
    this._kd = kd;
    this._wl = wl;
    this._wins = wins;
    this._kills = kills;
    this._xp = xp;
    this._losses = losses;
    this._deaths = deaths;
};


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports.getGeneralStatsWithFourCategories = function(gamePath, playerName, detailedMode = "") {
    return new Promise(resolve => {
        let path = `/player/${gamePath}/${playerName}`;
        let niceDetailedModeTitle = "";
        if (detailedMode !== "") {
            path = `/player/${gamePath}/${playerName}/${detailedMode}`;
            niceDetailedModeTitle = " " + detailedMode.replaceAll('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        }
        // Perform API request to Private API
        const options = {
            hostname: "localhost",
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'API-Key': API_KEY
            }
        }
        const req = http.request(options, res => {
            var d = '';
            if (res.statusCode == 200) {
                // Player data found
                res.on('data', chunk => {
                    d += chunk;
                });
                res.on('end', function() {
                    const statsObj = JSON.parse(d);
                    objVals = Object.values(statsObj.stats)
                    var currentStats = new GamemodeStats(objVals[0], objVals[1], objVals[2], objVals[3]);
                    let gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)}${niceDetailedModeTitle} Stats`)
                        .addFields({
                            name: ["bedwars"].includes(gamePath) ? "FK/D" : "K/D",
                            value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                            inline: true
                        }, {
                            name: 'W/L',
                            value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                            inline: true
                        }, {
                            name: '\u200B',
                            value: '\u200B'
                        }, {
                            name: 'Wins',
                            value: `Daily: \`${numberWithCommas(currentStats._wins[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._wins[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._wins[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._wins[3].overall)}\``,
                            inline: true
                        }, {
                            name: ["bedwars"].includes(gamePath) ? 'Final Kills' : 'Kills',
                            value: `Daily: \`${numberWithCommas(currentStats._kills[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kills[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kills[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kills[3].overall)}\``,
                            inline: true
                        }, )
                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());
                    resolve(gamemodeEmbed);
                });
            } else if (res.statusCode == 404) {
                // No player found
                const invalidPlayerEmbed = new Discord.MessageEmbed()
                    .setColor('#3e8ef7')
                    .setTitle(`Register New Player`)
                    .setDescription('Click the link above to start tracking that player!')
                    .setURL(rootURL + playerPath + `${playerName}`)
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL());
                resolve(invalidPlayerEmbed);
            } else {
                // Error with Private API request
                const errorEmbed = new Discord.MessageEmbed()
                    .setColor('#3e8ef7')
                    .setTitle(`An Error Has Occured!`)
                    .setDescription('Please contact The_Archer#1958 with this message!')
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL());
                resolve(errorEmbed);
            }
        });
        req.end();
    });
}

module.exports.getLBEmbed = function(params) {
    return new Promise(resolve => {
        if (params['timeframe'] == undefined || params['gamemode'] == undefined || params['stat'] == undefined) {
            const invalidLeaderboardEmbed = new Discord.MessageEmbed()
                .setColor('#3e8ef7')
                .setTitle(`Invalid Usage`)
                .setDescription('Use /help to find out how to use the leaderboard command. Example: `/lb sw kd`')
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL());
            resolve(invalidLeaderboardEmbed);
        }
        let niceDetailedModeTitle = "";
        let apipath = "/leaderboard/" + params['timeframe'] + "_" + params['gamemode'] + "_" + params['stat'];
        if (params['detailed_mode'] != undefined && params['detailed_mode'] != 'general') {
            apipath += "_" + params['detailed_mode'];
            niceDetailedModeTitle = " " + params['detailed_mode'].replaceAll('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        } else {
            niceDetailedModeTitle = '';
        }
        // Perform API request to Private API
        const options = {
            hostname: "localhost",
            path: apipath,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'API-Key': API_KEY
            }
        }
        const req = http.request(options, res => {
            var d = '';
            if (res.statusCode == 200) {
                // Leaderboard data found
                res.on('data', chunk => {
                    d += chunk;
                });
                res.on('end', function() {
                    const statsObj = JSON.parse(d).stats;
                    let leaderboardEmbed;
                    leaderboardEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(params['timeframe'])} ${params['gamemode'].toUpperCase()} ${params['stat'].toUpperCase()}${niceDetailedModeTitle} Leaderboard`)
                        .setTimestamp()
                        .setFooter(client.user.username, client.user.avatarURL());
                    if (statsObj == null || statsObj.length == 0) {
                        leaderboardEmbed.addFields({
                            name: "\u200b",
                            value: `No entries for this leaderboard could be found.`,
                            inline: false
                        });
                    }
                    for (let i = 0; i < 20; i++) {
                        if (statsObj[i] == null) continue;
                        leaderboardEmbed.addFields({
                            name: (i + 1) + ". " + statsObj[i].rawusername,
                            value: `${params['stat'].toUpperCase()}: \`${statsObj[i].value}\``,
                            inline: false
                        });
                    }
                    leaderboardEmbed.addFields({
                        name: "\u200b",
                        value: `You can find more entries and leaderboards on the [HyStats website](https://hystats.net/leaderboards).`,
                        inline: false
                    });
                    resolve(leaderboardEmbed);
                });
            } else {
                // No leaderboard found
                const invalidLeaderboardEmbed = new Discord.MessageEmbed()
                    .setColor('#3e8ef7')
                    .setTitle(`Invalid Leaderboard`)
                    .setDescription('Leaderboard cannot be found. Use >help to find valid leaderboard names. Example: `>lb overall sw kd`')
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL());
                resolve(invalidLeaderboardEmbed);
            }
        });
        req.on('error', error => {
            const errorEmbed = new Discord.MessageEmbed()
                .setColor('#3e8ef7')
                .setTitle(`Error proccessing command.`)
                .setDescription('Please try again later.')
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL());
            resolve(errorEmbed);
            client.users.fetch('237025024920256522').then((user) => {
                user.send(`Hystats could not connect!\n${error}`);
            });
            console.error(error)
        })

        req.end()
    });
}



// Hacky because discord forgets which button was clicked?, so we make the clicked one default
function findActiveButtonToSelect(selectionRow, target) {
    for (const opt of selectionRow['components'][0].options) {
        opt['default'] = opt.value === target;
    }
    return selectionRow;
}

// Set bot activity
client.on('ready', () => {
    client.user.setPresence({
        activities: [{
            name: 'your stats | >help',
            type: "WATCHING"
        }],
        status: 'online'
    });
    console.log(`Logged in as ${client.user.tag}!`);
    module.exports.client = client;
    // Remove in April 2022
    require('./legacy.js');
});

/* Do Commands Stuff */

// Require commands
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

// Handle command execution interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
        });
    }
});

// Handle select menu interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return;

    let selectionRow = findActiveButtonToSelect(interaction.message.components[0], interaction.values[0]);

    if (interaction.customId === 'gamemode') {
        let value = interaction.values[0];
        let options = value.split(':');
        let embed = await module.exports.getGeneralStatsWithFourCategories(options[1], options[0], options[2]);
        await interaction.update({
            embeds: [embed],
            components: [selectionRow]
        });
    } else if (interaction.customId === 'leaderboard') {
        let params = JSON.parse(interaction.values[0]);
        let embed = await module.exports.getLBEmbed(params);
        await interaction.update({
            embeds: [embed],
            components: [selectionRow]
        });
    }
});

client.login(token);