# discordle 

![CI Status](https://github.com/siddhu33/discordle/actions/workflows/node.js.yml/badge.svg)

Discord Bot to play a wordle-like game with users. 

## [Add this bot to your server!](https://discord.com/oauth2/authorize?client_id=931245994681700453&permissions=292057982976&scope=bot)

![Image](images/Discordle.png)

---
## Requirements

- ### `npm` of some kind installed.
- ### `.env` file with discord token `DISCORD_TOKEN` populated.
---
## Installation
```shell
npm install -g yarn
yarn install
yarn start
```
---
## Commands

```d
@Discordle !ping
```
### Ping server to see if it is up.

```d
@Discordle !start [length]
```
### Start a game of length `length`. Will pick out a word from the corpus file, `corpus.txt`.

```d
@Discordle !state
```
### Get the current state of a game, if one is currently being played in the channel.

```d
@Discordle !guess [word]
```
### Guess the word described by `word`. Will increment the guesses counter
---
## Feature Ideas

Pull requests very welcome for any of these!

1. State management of some kind ( Redis, DB, file, etc ) which can be loaded after restart.
2. Store grid of previous commands and results to see every guess made so far.
3. Set a limit of turns for a given game and create a loss condition if a limit is set.
4. Performance profiles & Sharded bot for improved performance
5. Custom images instead of emojis of letters with background colour depending on state.

## NB - Many many thanks to the developer of [Wordle](https://www.powerlanguage.co.uk/wordle/) for inspiring this bot!