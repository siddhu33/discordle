// Run dotenv
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS] 
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on('messageCreate', msg => {
    if (msg.content === 'ping') {
      msg.reply('pong');
    }
});

client.login(process.env.DISCORD_TOKEN);