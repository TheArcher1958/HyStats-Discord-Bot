fs = require('fs')
var https = require('https');
var http = require('http');
const Discord = require('discord.js');
const client = new Discord.Client();
const statGamemodes = ["skywars","bedwars","uhc","speeduhc","pit","paintball","murdermystery","megawalls","duels","blitz","general"]
const aliases = ["sw", "bw","uhc","su","pit","pb","mm","mw","duels","blitz","general"]


fs.readFile('./API-Key.txt', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    API_KEY = data.trim();
});



var GamemodeStats = function (kd, wl, wins, kills, xp, losses, deaths) {
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


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ activity: { name: 'your stats | >help', type: "WATCHING" }, status: 'online' });
});
const commandPrefix = ">"
client.on('message', msg => {

    if (msg.content[0] == commandPrefix) {
        var messageArguments = msg.content.slice(commandPrefix.length).trimEnd().split(" ");
        if (messageArguments[0].toLowerCase() === 'query' && messageArguments[1] != undefined) {
            msg.channel.startTyping();
            var options = {
                host: 'api.mcsrvstat.us',
                path: `/2/${messageArguments[1]}`,
                method: 'GET'
            };

            callback = function (response) {
                var str = '';

                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    const serverObj = JSON.parse(str);
                    let responseEmbed;
                    if (serverObj.online === true) {
                        responseEmbed = new Discord.MessageEmbed()
                            .setColor('#3e8ef7')
                            .setTitle(`Server Status: ${messageArguments[1]}`)
                            .setDescription(`${serverObj.motd.clean[0] != undefined ? serverObj.motd.clean[0] : ""}\n${serverObj.motd.clean[1] != undefined ? serverObj.motd.clean[1] : ""}`)
                            .setThumbnail(`https://api.mcsrvstat.us/icon/${messageArguments[1]}`)
                            .addFields(
                                {
                                    name: "Players",
                                    value: `${serverObj.players.online}/${serverObj.players.max}`,
                                    inline: false
                                },
                                {name: 'Version', value: `${serverObj.version}\t`, inline: false},
                                {name: 'IP : PORT', value: `${serverObj.ip} : ${serverObj.port}\t`, inline: false},
                            )
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

                    msg.channel.send(responseEmbed).then(() => msg.channel.stopTyping());
                });
            }

            https.request(options, callback).end();



        } else if (statGamemodes.includes(messageArguments[0].toLowerCase()) || aliases.includes(messageArguments[0].toLowerCase())) {
            msg.channel.startTyping();
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
                if (res.statusCode == 200) {
                    res.on('data', d => {
                        const statsObj = JSON.parse(d);
                        objVals = Object.values(statsObj.stats)
                        let gamemodeEmbed;

                        if (["pit", "paintball", "pb"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath.toLowerCase())} Stats`)
                                .addFields(
                                    {
                                        name: "K/D",
                                        value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                )
                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());

                        } else if (["murdermystery", "speeduhc", "duels", "mm", "su"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${gamePath.toLowerCase() === "murdermystery" ? "Murder Mystery" : capitalizeFirstLetter(messageArguments[0].toLowerCase())} Stats`)
                                .addFields(
                                    {
                                        name: "K/D",
                                        value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                    {
                                        name: 'W/L',
                                        value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                )
                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        } else if (["skywars", "bedwars", "sw", "bw"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0], objVals[1], objVals[2], objVals[3]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                                .addFields(
                                    {
                                        name: ["bw", "bedwars"].includes(gamePath) ? "FK/D" : "K/D",
                                        value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                    {
                                        name: 'W/L',
                                        value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                    {name: '\u200B', value: '\u200B'},
                                    {
                                        name: 'Wins',
                                        value: `Daily: \`${numberWithCommas(currentStats._wins[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._wins[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._wins[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._wins[3].overall)}\``,
                                        inline: true
                                    },
                                    {
                                        name: ["bw", "bedwars"].includes(gamePath) ? 'Final Kills' : 'Kills',
                                        value: `Daily: \`${numberWithCommas(currentStats._kills[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kills[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kills[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kills[3].overall)}\``,
                                        inline: true
                                    },
                                )

                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        } else if (["megawalls", "mw"].includes(gamePath)) {
                            var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                                .addFields(
                                    {
                                        name: "FK/D",
                                        value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                    {
                                        name: 'W/L',
                                        value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                )

                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        } else if (gamePath === "general") {
                            console.log(currentStats);
                            var currentStats = new GamemodeStats(objVals[5], objVals[4], objVals[0], objVals[2], objVals[6], objVals[1], objVals[3]);
                            //kd, wl, wins, kills, xp, losses, deaths

                            //wins, losses, kills, deaths, kd, wl, xp
                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                                .addFields(
                                    {
                                        name: "Wins",
                                        value: `Daily: \`${numberWithCommas(currentStats._wins[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._wins[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._wins[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._wins[3].overall)}\``,
                                        inline: true
                                    },
                                    {
                                        name: 'Losses',
                                        value: `Daily: \`${numberWithCommas(currentStats._losses[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._losses[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._losses[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._losses[3].overall)}\``,
                                        inline: true
                                    },
                                    {name: '\u200B', value: '\u200B'},
                                    {
                                        name: 'Kills',
                                        value: `Daily: \`${numberWithCommas(currentStats._kills[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._kills[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._kills[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._kills[3].overall)}\``,
                                        inline: true
                                    },
                                    {
                                        name: 'Deaths',
                                        value: `Daily: \`${numberWithCommas(currentStats._deaths[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._deaths[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._deaths[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._deaths[3].overall)}\``,
                                        inline: true
                                    },
                                    {name: '\u200B', value: '\u200B'},
                                    {
                                        name: "K/D",
                                        value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                    {
                                        name: 'W/L',
                                        value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                    {name: '\u200B', value: '\u200B'},
                                    {
                                        name: 'Network XP',
                                        value: `Daily: \`${numberWithCommas(currentStats._xp[0].daily)}\`\nWeekly: \`${numberWithCommas(currentStats._xp[1].weekly)}\`\nMonthly: \`${numberWithCommas(currentStats._xp[2].monthly)}\`\nOverall: \`${numberWithCommas(currentStats._xp[3].overall)}\``,
                                        inline: true
                                    },
                                )

                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        }  else if(gamePath === "uhc") {
                            var currentStats = new GamemodeStats(objVals[0], objVals[1]);

                            gamemodeEmbed = new Discord.MessageEmbed()
                                .setColor('#3e8ef7')
                                .setTitle(`${capitalizeFirstLetter(playerName)} ${capitalizeFirstLetter(gamePath)} Stats`)
                                .addFields(
                                    {
                                        name: "Wins",
                                        value: `Daily: \`${currentStats._kd[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._kd[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._kd[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._kd[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                    {
                                        name: 'K/D',
                                        value: `Daily: \`${currentStats._wl[0].daily.toFixed(2)}\`\nWeekly: \`${currentStats._wl[1].weekly.toFixed(2)}\`\nMonthly: \`${currentStats._wl[2].monthly.toFixed(2)}\`\nOverall: \`${currentStats._wl[3].overall.toFixed(2)}\``,
                                        inline: true
                                    },
                                )

                                .setThumbnail(`https://minotar.net/helm/${playerName}`)
                                .setTimestamp()
                                .setFooter(client.user.username, client.user.avatarURL());
                        }


                        msg.channel.send(gamemodeEmbed).then(() => msg.channel.stopTyping());
                    });


                } else if (res.statusCode == 404) {
                    const invalidPlayerEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`Invalid Player`)
                        .setDescription('Click to start tracking that player!')
                        .setURL(`https://hystats.net/player/${playerName}`)
                        .setTimestamp()
                        .setFooter(client.user.username, client.user.avatarURL());
                    msg.channel.send(invalidPlayerEmbed).then(() => msg.channel.stopTyping());
                } else if (res.statusCode == 403) {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor('#3e8ef7')
                        .setTitle(`An Error Has Occured!`)
                        .setDescription('Please contact The_Archer#1958 with this message!')
                        .setTimestamp()
                        .setFooter(client.user.username, client.user.avatarURL());
                    msg.channel.send(errorEmbed).then(() => msg.channel.stopTyping());
                }


            })
            req.on('error', error => {
                const errorEmbed = new Discord.MessageEmbed()
                    .setColor('#3e8ef7')
                    .setTitle(`Error proccessing command.`)
                    .setDescription('Please try again later.')
                    .setTimestamp()
                    .setFooter(client.user.username, client.user.avatarURL());
                msg.channel.send(errorEmbed).then(() => msg.channel.stopTyping());
                client.users.fetch('237025024920256522').then((user) => {
                    user.send(`Hystats could not connect!\n${error}`);
                });
                console.error(error)
            })

            req.end()



        } else if(messageArguments[0].toLowerCase() === "help") {
            const helpEmbed = new Discord.MessageEmbed()
                .setColor('#3e8ef7')
                .setTitle(`Command List`)
                //.setDescription('')
                .addFields(
                    {
                        name: '>[gamemode] [username]',
                        value: 'Returns stats for that gamemode.\n\`(sw,bw,mm,blitz,duels,mw,pb,pit,su,uhc,general)\`\ne.g. \`>sw The_Archer\`\nLeaving your username blank will use your discord username.',
                        inline: false
                    },
                    {
                        name: '>query',
                        value: `Returns info about the server if it is online.\ne.g. \`>query hypixel.net\``,
                        inline: false
                    },
                )
                .setTimestamp()
                .setFooter(client.user.username, client.user.avatarURL());
            msg.channel.send(helpEmbed);
        }
    }



});

fs.readFile('./token.txt', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    client.login(data.trim());
});


