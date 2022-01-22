// Run dotenv
require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { Client, Intents } = require('discord.js');
const { defaultState, commands } = require('./commands');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});
const CORPUS_PATH = 'corpus.txt';
const stream = fs.createReadStream(CORPUS_PATH);
const myInterface = readline.createInterface({
  input: stream,
});

const gamesByChannel = {
};

const wordsByLength = {};

const loadCorpus = async () => {
  console.log('starting...');
  for await (const line of myInterface) {
    const lengthStr = line.length.toString();
    if (Object.keys(wordsByLength).includes(lengthStr)) {
      wordsByLength[lengthStr].push(line);
    } else {
      wordsByLength[lengthStr] = [line];
    }
  }
  console.log('corpus word statistics:');
  console.table(Object.entries(wordsByLength).map((e) => ({ length: e[0], count: e[1].length })));
};
loadCorpus();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const parse = (msg) => {
  const tokens = msg.content.split(' ');
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.startsWith('!')) {
      const command = token.substring(1);
      if (command === 'ping' || command === 'state') {
        return {
          command,
          args: [],
          errorMsg: '',
        };
      }
      if (i + 1 < tokens.length) {
        return {
          command,
          args: tokens.slice(i + 1),
          errorMsg: '',
        };
      }
      return {
        command: 'error',
        args: [],
        errorMsg: `Could not find arguments for command ${command}.`,
      };
    }
  }
  return {
    command: 'error',
    args: [],
    errorMsg: 'Could not find a valid command in message',
  };
};

const executeCommand = (msg, commandObj) => {
  const commandFunc = commands[commandObj.command];
  if (commandFunc != null) {
    const gameState = gamesByChannel[msg.channelId] || defaultState();
    const replyObj = commandFunc(commandObj.args, wordsByLength, gameState);
    gamesByChannel[msg.channelId] = replyObj.gameState;
    return replyObj.reply;
  }
  return `Command ${commandObj.command} is not valid.`;
};

client.on('messageCreate', (msg) => {
  const botMentioned = Boolean(msg.mentions.users.get(client.user.id));
  if (botMentioned) {
    const commandObj = parse(msg);
    try {
      if (commandObj.command === 'error') {
        throw commandObj.errorMsg;
      } else {
        msg.reply(executeCommand(msg, commandObj));
      }
    } catch (error) {
      console.error(error);
      msg.reply(`error: ${JSON.stringify(error)}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
