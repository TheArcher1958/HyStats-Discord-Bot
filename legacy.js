const parent = require('./index.js');
const client = parent.client;

const fs = require('fs');
const https = require('https');
const http = require('http');
const Discord = require('discord.js');
const statGamemodes = ["skywars", "bedwars", "uhc", "speeduhc", "pit", "paintball", "murdermystery", "megawalls", "duels", "blitz", "skyblock", "general", "ranksgifted"];
const aliases = ["sw", "bw", "uhc", "su", "pit", "pb", "mm", "mw", "duels", "blitz", "sb", "general", "ranksgifted"];
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

var SkyBlockStats = function(farmingxp, miningxp, combatxp, foragingxp, fishingxp, enchantingxp, alchemyxp, runecraftingxp) {
    this._farmingxp = parseSkyBlockSkillNumber(farmingxp);
    this._miningxp = parseSkyBlockSkillNumber(miningxp);
    this._combatxp = parseSkyBlockSkillNumber(combatxp);
    this._foragingxp = parseSkyBlockSkillNumber(foragingxp);
    this._fishingxp = parseSkyBlockSkillNumber(fishingxp);
    this._enchantingxp = parseSkyBlockSkillNumber(enchantingxp);
    this._alchemyxp = parseSkyBlockSkillNumber(alchemyxp);
    this._runecraftingxp = parseSkyBlockSkillNumber(runecraftingxp);
};


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseSkyBlockSkillNumber(expArray) {
    for (let obj of expArray) {
        for (key of Object.keys(obj)) {
            obj[key] = obj[key] < 1 ? 0 : numberWithCommas(Math.floor(obj[key]));
        }
    }
    return expArray;
}

function getServerStatus(msg) {
    var messageArguments = msg.content.slice(commandPrefix.length).trimEnd().split(" ");
    msg.channel.sendTyping();
    var options = {
        host: 'api.mcsrvstat.us',
        path: `/2/${messageArguments[1]}`,
        method: 'GET'
    };

    callback = function(response) {
        var str = '';

        response.on('data', function(chunk) {
            str += chunk;
        });

        response.on('end', function() {
            const serverObj = JSON.parse(str);
            let responseEmbed;
            if (serverObj.online === true) {
                responseEmbed = new Discord.MessageEmbed()
                    .setColor('#3e8ef7')
                    .setTitle(`Server Status: ${messageArguments[1]}`)
                    .setDescription(`${serverObj.motd.clean[0] != undefined ? serverObj.motd.clean[0] : ""}\n${serverObj.motd.clean[1] != undefined ? serverObj.motd.clean[1] : ""}`)
                    .setThumbnail(`https://api.mcsrvstat.us/icon/${messageArguments[1]}`)
                    .addFields({
                        name: "Players",
                        value: `${serverObj.players.online}/${serverObj.players.max}`,
                        inline: false
                    }, {
                        name: 'Version',
                        value: `${serverObj.version}\t`,
                        inline: false
                    }, {
                        name: 'IP : PORT',
                        value: `${serverObj.ip} : ${serverObj.port}\t`,
                        inline: false
                    }, )
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.displayAvatarURL());
            } else {
                responseEmbed = new Discord.MessageEmbed()
                    .setColor('#3e8ef7')
                    .setTitle(`Server Status: ${messageArguments[1]}`)
                    .setDescription(`The server is offline!`)
                    .setThumbnail(`https://api.mcsrvstat.us/icon/${messageArguments[1]}`)
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL());
            }

            msg.channel.send({
                embeds: [responseEmbed]
            });
        });
    }

    https.request(options, callback).end();
}

function getLBResponse(msg) {
    var messageArguments = msg.content.slice(commandPrefix.length).trimEnd().split(" ");
    if (messageArguments[1] == undefined || messageArguments[2] == undefined || messageArguments[3] == undefined) {
        const invalidLeaderboardEmbed = new Discord.MessageEmbed()
            .setColor('#3e8ef7')
            .setTitle(`Invalid Usage`)
            .setDescription('Use >help to find out how to use the leaderboard command. Example: `>lb overall sw kd`')
            .setTimestamp()
            .setFooter(client.user.username, client.user.avatarURL());
        msg.channel.send({
            embeds: [invalidLeaderboardEmbed]
        });
        return;
    }
    let timeframeChosen = messageArguments[1];
    let gamemodeChosen = messageArguments[2];
    let statChosen = messageArguments[3];
    let apipath = "/leaderboard/" + timeframeChosen + "_" + gamemodeChosen + "_" + statChosen;
    // Allow an arbitrary amount of further arguments  to specify the sub gamemodes chosen
    let i = 4;
    var gamesubmodeChosen = "";
    while (messageArguments[i] != undefined) {
        apipath += "_" + messageArguments[i];
        gamesubmodeChosen = gamesubmodeChosen + " " + messageArguments[i].toUpperCase();
        i++;
    }
    msg.channel.sendTyping();
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
            res.on('data', chunk => {
                d += chunk;
            });
            res.on('end', function() {
                const statsObj = JSON.parse(d).stats;
                let leaderboardEmbed;
                leaderboardEmbed = new Discord.MessageEmbed()
                    .setColor('#3e8ef7')
                    .setTitle(`${capitalizeFirstLetter(timeframeChosen)} ${gamemodeChosen.toUpperCase()} ${statChosen.toUpperCase()}${gamesubmodeChosen} Leaderboard`)
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
                        value: `${statChosen.toUpperCase()}: \`${statsObj[i].value}\``,
                        inline: false
                    });
                }
                leaderboardEmbed.addFields({
                    name: "\u200b",
                    value: `You can find more entries and leaderboards on the [HyStats website](https://hystats.net/leaderboards).`,
                    inline: false
                });
                msg.channel.send({
                    embeds: [leaderboardEmbed]
                });
            });
        } else {
            const invalidLeaderboardEmbed = new Discord.MessageEmbed()
                .setColor('#3e8ef7')
                .setTitle(`Invalid Leaderboard`)
                .setDescription('Leaderboard cannot be found. Use >help to find valid leaderboard names. Example: `>lb overall sw kd`')
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL());
            msg.channel.send({
                embeds: [invalidLeaderboardEmbed]
            });
        }
    });
    req.on('error', error => {
        const errorEmbed = new Discord.MessageEmbed()
            .setColor('#3e8ef7')
            .setTitle(`Error proccessing command.`)
            .setDescription('Please try again later.')
            .setTimestamp()
            .setFooter(client.user.username, client.user.avatarURL());
        msg.channel.send({
            embeds: [errorEmbed]
        });
        client.users.fetch('237025024920256522').then((user) => {
            user.send(`Hystats could not connect!\n${error}`);
        });
        console.error(error)
    })

    req.end()
}

function getGamemodeResponse(msg) {
    var messageArguments = msg.content.slice(commandPrefix.length).trimEnd().split(" ");
    msg.channel.sendTyping();
    let playerName = msg.author.username;
    if (messageArguments[1] != undefined) {
        playerName = messageArguments[1];
    }
    let gamePath = messageArguments[0].toLowerCase();
    if (aliases.includes(messageArguments[0].toLowerCase())) {
        gamePath = statGamemodes[aliases.indexOf(messageArguments[0].toLowerCase())]
    }
    let gamemodeEmbed;
    const options = {
        hostname: "localhost",
        path: `/player/${gamePath}/${playerName}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'API-Key': API_KEY
        }
    }
    const req = http.request(options, res => {
        var d = '';
        if (res.statusCode == 200) {
            res.on('data', chunk => {
                d += chunk;
            });
            res.on('end', function() {
                const statsObj = JSON.parse(d);
                objVals = Object.values(statsObj.stats)
                let gamemodeEmbed;

                if (["pit", "paintball", "pb"].includes(gamePath)) {
                    var currentStats = new GamemodeStats(objVals[0]);

                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath.toLowerCase())} Stats`)
                        .addFields({
                            name: "K/D",
                            value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                            inline: true
                        }, )
                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());

                } else if (["murdermystery", "speeduhc", "mm", "su"].includes(gamePath)) {
                    var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${gamePath.toLowerCase() === "murdermystery" ? "Murder Mystery" : capitalizeFirstLetter(messageArguments[0].toLowerCase())} Stats`)
                        .addFields({
                            name: "K/D",
                            value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                            inline: true
                        }, {
                            name: 'W/L',
                            value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                            inline: true
                        }, )
                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());
                } else if (["skywars", "bedwars", "sw", "bw", "duels"].includes(gamePath)) {
                    var currentStats = new GamemodeStats(objVals[0], objVals[1], objVals[2], objVals[3]);
                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                        .addFields({
                            name: ["bw", "bedwars"].includes(gamePath) ? "FK/D" : "K/D",
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
                            name: ["bw", "bedwars"].includes(gamePath) ? 'Final Kills' : 'Kills',
                            value: `Daily: \`${numberWithCommas(currentStats._kills[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kills[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kills[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kills[3].overall)}\``,
                            inline: true
                        }, )

                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());
                } else if (["megawalls", "mw"].includes(gamePath)) {
                    var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                        .addFields({
                            name: "FK/D",
                            value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                            inline: true
                        }, {
                            name: 'W/L',
                            value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                            inline: true
                        }, )

                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());
                } else if (gamePath === "general") {
                    var currentStats = new GamemodeStats(objVals[5], objVals[4], objVals[0], objVals[2], objVals[6], objVals[1], objVals[3]);
                    //kd, wl, wins, kills, xp, losses, deaths

                    //wins, losses, kills, deaths, kd, wl, xp
                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                        .addFields({
                            name: "Wins",
                            value: `Daily: \`${numberWithCommas(currentStats._wins[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._wins[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._wins[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._wins[3].overall)}\``,
                            inline: true
                        }, {
                            name: 'Losses',
                            value: `Daily: \`${numberWithCommas(currentStats._losses[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._losses[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._losses[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._losses[3].overall)}\``,
                            inline: true
                        }, {
                            name: '\u200B',
                            value: '\u200B'
                        }, {
                            name: 'Kills',
                            value: `Daily: \`${numberWithCommas(currentStats._kills[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kills[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kills[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kills[3].overall)}\``,
                            inline: true
                        }, {
                            name: 'Deaths',
                            value: `Daily: \`${numberWithCommas(currentStats._deaths[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._deaths[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._deaths[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._deaths[3].overall)}\``,
                            inline: true
                        }, {
                            name: '\u200B',
                            value: '\u200B'
                        }, {
                            name: "K/D",
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
                            name: 'Network XP',
                            value: `Daily: \`${numberWithCommas(currentStats._xp[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._xp[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._xp[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._xp[3].overall)}\``,
                            inline: true
                        }, )

                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());
                } else if (["skyblock", "sb"].includes(gamePath)) {
                    var currentStats = new SkyBlockStats(objVals[0], objVals[1], objVals[2], objVals[3], objVals[4], objVals[5], objVals[6], objVals[7]);
                    console.log(currentStats._farmingxp[0].weekly);
                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                        .setDescription(`*Only highest profile counts.*`)
                        .addFields({
                            name: "Farming EXP",
                            value: `Daily: \`${currentStats._farmingxp[0].daily}\`\nWeekly: \`${currentStats._farmingxp[1].weekly}\`\nMonthly: \`${currentStats._farmingxp[2].monthly}\`\nOverall: \`${currentStats._farmingxp[3].overall}\``,
                            inline: true
                        }, {
                            name: 'Mining EXP',
                            value: `Daily: \`${currentStats._miningxp[0].daily}\`\nWeekly: \`${currentStats._miningxp[1].weekly}\`\nMonthly: \`${currentStats._miningxp[2].monthly}\`\nOverall: \`${currentStats._miningxp[3].overall}\``,
                            inline: true
                        }, {
                            name: '\u200B',
                            value: '\u200B'
                        }, {
                            name: 'Combat EXP',
                            value: `Daily: \`${currentStats._combatxp[0].daily}\`\nWeekly: \`${currentStats._combatxp[1].weekly}\`\nMonthly: \`${currentStats._combatxp[2].monthly}\`\nOverall: \`${currentStats._combatxp[3].overall}\``,
                            inline: true
                        }, {
                            name: 'Foraging EXP',
                            value: `Daily: \`${currentStats._foragingxp[0].daily}\`\nWeekly: \`${currentStats._foragingxp[1].weekly}\`\nMonthly: \`${currentStats._foragingxp[2].monthly}\`\nOverall: \`${currentStats._foragingxp[3].overall}\``,
                            inline: true
                        }, {
                            name: '\u200B',
                            value: '\u200B'
                        }, {
                            name: 'Fishing EXP',
                            value: `Daily: \`${currentStats._fishingxp[0].daily}\`\nWeekly: \`${currentStats._fishingxp[1].weekly}\`\nMonthly: \`${currentStats._fishingxp[2].monthly}\`\nOverall: \`${currentStats._fishingxp[3].overall}\``,
                            inline: true
                        }, {
                            name: 'Enchanting EXP',
                            value: `Daily: \`${currentStats._enchantingxp[0].daily}\`\nWeekly: \`${currentStats._enchantingxp[1].weekly}\`\nMonthly: \`${currentStats._enchantingxp[2].monthly}\`\nOverall: \`${currentStats._enchantingxp[3].overall}\``,
                            inline: true
                        }, {
                            name: '\u200B',
                            value: '\u200B'
                        }, {
                            name: 'Alchemy EXP',
                            value: `Daily: \`${currentStats._alchemyxp[0].daily}\`\nWeekly: \`${currentStats._alchemyxp[1].weekly}\`\nMonthly: \`${currentStats._alchemyxp[2].monthly}\`\nOverall: \`${currentStats._alchemyxp[3].overall}\``,
                            inline: true
                        }, {
                            name: 'Runecrafting EXP',
                            value: `Daily: \`${currentStats._runecraftingxp[0].daily}\`\nWeekly: \`${currentStats._runecraftingxp[1].weekly}\`\nMonthly: \`${currentStats._runecraftingxp[2].monthly}\`\nOverall: \`${currentStats._runecraftingxp[3].overall}\``,
                            inline: true
                        }, )

                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());
                } else if (gamePath === "uhc") {
                    var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                        .addFields({
                            name: "Wins",
                            value: `Daily: \`${numberWithCommas(currentStats._kd[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kd[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kd[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kd[3].overall)}\``,
                            inline: true
                        }, {
                            name: 'K/D',
                            value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                            inline: true
                        }, )

                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());
                } else if (["blitz"].includes(gamePath)) {
                    var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath.toLowerCase())} Stats`)
                        .addFields({
                            name: "Wins",
                            value: `Daily: \`${numberWithCommas(currentStats._kd[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kd[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kd[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kd[3].overall)}\``,
                            inline: true
                        }, {
                            name: 'K/D',
                            value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                            inline: true
                        }, )
                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setURL(rootURL + playerPath + gamePath + `/` + playerName)
                        .setFooter(client.user.username, client.user.avatarURL());

                } else if (["ranksgifted"].includes(gamePath)) {
                    var currentStats = new GamemodeStats(objVals[0]);

                    gamemodeEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`${capitalizeFirstLetter(playerName)} Ranks Gifted Stats`)
                        .addFields({
                            name: "Ranks Gifted",
                            value: `Daily: \`${numberWithCommas(currentStats._kd[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kd[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kd[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kd[3].overall)}\``,
                            inline: true
                        })
                        .setThumbnail(`https://minotar.net/helm/${playerName}`)
                        .setTimestamp()
                        .setFooter(client.user.username, client.user.avatarURL());

                }


                msg.channel.send({
                    embeds: [gamemodeEmbed]
                });
            });


        } else if (res.statusCode == 404) {
            const invalidPlayerEmbed = new Discord.MessageEmbed()
                .setColor('#3e8ef7')
                .setTitle(`Register New Player`)
                .setDescription('Click the link above to start tracking that player!')
                .setURL(rootURL + playerPath + `${playerName}`)
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL());
            msg.channel.send({
                embeds: [invalidPlayerEmbed]
            });
        } else if (res.statusCode == 403) {
            const errorEmbed = new Discord.MessageEmbed()
                .setColor('#3e8ef7')
                .setTitle(`An Error Has Occured!`)
                .setDescription('Please contact The_Archer#1958 with this message!')
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL());
            msg.channel.send({
                embeds: [errorEmbed]
            });
        }


    })
    req.on('error', error => {
        const errorEmbed = new Discord.MessageEmbed()
            .setColor('#3e8ef7')
            .setTitle(`Error proccessing command.`)
            .setDescription('Please try again later.')
            .setTimestamp()
            .setFooter(client.user.username, client.user.avatarURL());
        msg.channel.send({
            embeds: [errorEmbed]
        });
        client.users.fetch('237025024920256522').then((user) => {
            user.send(`Hystats could not connect!\n${error}`);
        });
        console.error(error)
    })

    req.end()
}

function getHelpResonse(msg) {
    const helpEmbed = new Discord.MessageEmbed()
        .setColor('#3e8ef7')
        .setTitle(`Command List`)
        //.setDescription('')
        .addFields({
            name: '>[gamemode] [username]',
            value: 'Returns stats for that gamemode.\n\`(sw,bw,sb,mm,blitz,duels,mw,pb,pit,su,uhc,ranksgifted,general)\`\ne.g. \`>sw The_Archer\`\nLeaving your username blank will use your discord username.',
            inline: false
        }, {
            name: '>lb [timeframe] [gamemode] [stat] {subgamemodetype}',
            value: 'Returns leaderboards for that gamemode.\nValid values for \`timeframe\` are \`(overall, daily, weekly, monthly)\`\nValid values for \`gamemode\` are \`(sw, bw, sb, duels, uhc, blitz, speed, murder, pit, mw, pb)\`\nValid values for \`stat\` are \`(kills, wins, kd, wl, fkd, fkills, ...)\`\nValid values for the optional field \`subgamemodetype\` are \`(solo_normal, 4v4v4v4, solo, doubles, exp_farming, ...)\`\ne.g. \`>lb overall sw kd\`\ne.g. \`>lb daily bw fkills doubles\`\ne.g. \`>lb monthly sb exp_farming\`',
            inline: false
        }, {
            name: '>query',
            value: `Returns info about the server if it is online.\ne.g. \`>query hypixel.net\``,
            inline: false
        }, {
            name: '>invite',
            value: `Returns the link to invite this bot to your Discord server.`,
            inline: false
        })
        .setTimestamp()
        .setFooter(client.user.username, client.user.avatarURL());
    msg.channel.send({
        embeds: [helpEmbed]
    });
}

function getInviteResponse(msg) {
    const helpEmbed = new Discord.MessageEmbed()
        .setColor('#3e8ef7')
        .setTitle(`Click Here to Invite the Bot`)
        .setURL('https://discord.com/api/oauth2/authorize?client_id=' + client.user.id + '&permissions=2048&scope=bot')
        .setDescription('Click the link above to invite this bot to your Discord server.')
        .setTimestamp()
        .setFooter(client.user.username, client.user.avatarURL());
    msg.channel.send({
        embeds: [helpEmbed]
    });
}



/* Legacy after April 2022 */
const commandPrefix = ">"
client.on('messageCreate', msg => {
    var messageArguments = msg.content.slice(commandPrefix.length).trimEnd().split(" ");
    if (msg.content[0] == commandPrefix) {

        if (messageArguments[0].toLowerCase() === 'query' && messageArguments[1] != undefined) {

            getServerStatus(msg);

        } else if (messageArguments[0].toLowerCase() === 'lb') {

            getLBResponse(msg);

        } else if (statGamemodes.includes(messageArguments[0].toLowerCase()) || aliases.includes(messageArguments[0].toLowerCase())) {

            getGamemodeResponse(msg);

        } else if (messageArguments[0].toLowerCase() === "help") {

            getHelpResonse(msg);

        } else if (messageArguments[0].toLowerCase() === "invite") {

            getInviteResponse(msg);

        }
    }
});