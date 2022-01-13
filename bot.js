// Run dotenv
require('dotenv').config();
const fs = require('fs');
const readline = require("readline");
const { Client, Intents } = require('discord.js');
const { defaultState, commands } = require('./commands');
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

const stream = fs.createReadStream("corpus.txt");
var myInterface = readline.createInterface({
    input: stream
});

let gamesByChannel = {
};

const wordsByLength = {};

const start = async () => {
    console.log("starting...");
    for await (const line of myInterface) {
        const lengthStr = line.length.toString();
        if (Object.keys(wordsByLength).includes(lengthStr)) {
            wordsByLength[lengthStr].push(line)
        } else {
            wordsByLength[lengthStr] = [line];
        }
    }
    console.log(Object.entries(wordsByLength).map(e => ({length : e[0], count : e[1].length})));
}
start();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const parse = (msg) => {
    const tokens = msg.content.split(" ");
    for(var i=0; i<tokens.length; i++){
        const token = tokens[i];
        if(token.startsWith("!")){
            const command = token.substring(1);
            if (command === "ping" || command === "state"){
                return {
                    command : command,
                    args : [],
                    errorMsg : ""
                }
            } else {
                if(i+1<tokens.length){
                    return {
                        command : command,
                        args : tokens.slice(i+1),
                        errorMsg : ""
                    }
                }else{
                    return {
                        command : "error",
                        args : [],
                        errorMsg : `Could not find arguments for command ${command}.`
                    }
                }
            }
        }
    }
}

client.on('messageCreate', msg => {
    botMentioned = Boolean(msg.mentions.users.get(client.user.id))
    if (botMentioned) {
        const commandObj = parse(msg);
        try{
            if(commandObj.command === "error"){
                throw commandObj.errorMsg;
            }
            const commandFunc = commands[commandObj.command];
            const gameState = gamesByChannel[msg.channelId] || defaultState();
            const replyObj = commandFunc(commandObj.args, wordsByLength, gameState);
            gamesByChannel[msg.channelId] = replyObj.gameState;
            msg.reply(replyObj.reply);
        } catch ( error ) {
            console.error(error);
            msg.reply(`error: ${JSON.stringify(error)}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);