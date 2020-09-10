fs = require('fs')
var http = require('https');
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
const commandPrefix = ">"
client.on('message', msg => {
    if(msg.content[0] == commandPrefix) {
        var messageArguments = msg.content.slice(commandPrefix.length).trim().split(" ");
        if (messageArguments[0] === 'query' && messageArguments[1] != undefined) {
            console.log("found request")
            var options = {
                host: 'api.mcsrvstat.us',
                path: `/2/${messageArguments[1]}`,
                method: 'GET'
            };

            callback = function(response) {
                var str = '';

                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    console.log(str);
                    const serverObj = JSON.parse(str);
                    let responseEmbed;
                    if (serverObj.online === true) {
                        responseEmbed = new Discord.MessageEmbed()
                            .setColor('#890df3')
                            .setTitle(`Server Status: ${messageArguments[1]}`)
                            .setDescription(`${serverObj.motd.clean[0]}\n${serverObj.motd.clean[1]}`)
                            .setThumbnail(`https://api.mcsrvstat.us/icon/${messageArguments[1]}`)
                            .addFields(
                                {name: "Players", value: `${serverObj.players.online}/${serverObj.players.max}\t`, inline: false},
                                {name: 'Version', value: `${serverObj.version}\t`, inline: false},
                                {name: 'IP : PORT', value: `${serverObj.ip} : ${serverObj.port}\t`, inline: false},

                            )
                            .setTimestamp()
                            .setFooter(client.user.username, client.user.displayAvatarURL());
                    } else {
                        responseEmbed = new Discord.MessageEmbed()
                            .setColor('#890df3')
                            .setTitle(`Server Status: ${messageArguments[1]}`)
                            .setDescription(`The server is offline!`)
                            .setThumbnail(`https://api.mcsrvstat.us/icon/${messageArguments[1]}`)
                            .setTimestamp()
                            .setFooter(client.user.username, client.user.avatarURL());
                    }

                    msg.channel.send(responseEmbed);
                });
            }

            http.request(options, callback).end();
        }
    }
});

fs.readFile('./token.txt', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    client.login(data);
});










