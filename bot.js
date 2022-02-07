// Run dotenv
const { createClient } = require('redis');

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

const isLocalhost = (inp) => Boolean(
  inp.includes('localhost')
  // [::1] is the IPv6 localhost address.
  || inp === '[::1]'
  // 127.0.0.1/8 is considered localhost for IPv4.
  || inp.match(
    /.*127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}.*/,
  ),
);

const CORPUS_PATH = 'corpus.txt';
const REDIS_URL = process.env.REDIS_TLS_URL ? process.env.REDIS_TLS_URL : process.env.REDIS_URL;

const getRedisClient = () => {
  const redisOptions = {
    url: REDIS_URL,
  };
  if (!isLocalhost(REDIS_URL)) {
    console.log('adding tls...');
    redisOptions.socket = {
      // Heroku uses self-signed certificate, which will cause error in connection
      // unless check is disabled
      tls: true,
      rejectUnauthorized: false,
    };
  }
  return redisOptions;
};

const REDIS_CLIENT = getRedisClient();
const stream = fs.createReadStream(CORPUS_PATH);
const myInterface = readline.createInterface({
  input: stream,
});

const parseGameState = (data) => {
  const gs = JSON.parse(data[1]);
  gs.letters = new Set(gs.letters);
  return [data[0].toString(), gs];
};

let gamesByChannel = {};
const wordsByLength = {};

const loadRedis = async () => {
  let data = {};
  const redisClient = createClient(REDIS_CLIENT);
  try {
    await redisClient.connect();
    data = await redisClient.hGetAll('gameState');
    data = Object.fromEntries(Object.entries(data).map(parseGameState));
  } catch (error) {
    console.error("Couldn't load key gameState from redis URL %s due to error %s", process.env.REDIS_URL, error);
  } finally {
    redisClient.disconnect();
    console.log('Loaded data from Redis');
    console.table(data);
    gamesByChannel = data;
  }
};

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
// load redis data and corpus data
loadRedis();
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
  const messageNotBot = msg.author.id !== client.user.id;
  if (botMentioned && messageNotBot) {
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

const redisExitHandler = async () => {
  console.log('exiting now, writing current state to redis...');
  const redisClient = createClient(REDIS_CLIENT);
  try {
    await redisClient.connect();
    const results = [];
    for (const e of Object.entries(gamesByChannel)) {
      const [key, value] = e;
      const valueArray = Array.from(value.letters);
      if (value.started) {
        results.push(redisClient.hSet('gameState', key, JSON.stringify({ ...value, letters: valueArray })));
      } else {
        results.push(redisClient.hDel('gameState', key));
      }
    }
    await Promise.all(results);
  } catch (error) {
    console.error('could not publish existing state to redis %s due to error %s', process.env.REDIS_URL, error);
  } finally {
    console.log('successfully written current results to redis.');
    redisClient.disconnect();
  }
  process.exit(0);
};

// exit handlers to dump to redis before exiting.
process.on('SIGINT', redisExitHandler);
process.on('SIGTERM', redisExitHandler);
