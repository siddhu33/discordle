# discordle
Discord Bot to play a wordle-like game with users.

![Image](images/Discordle.png)

## Installation
```shell
yarn install
```

```d
@Discordle !ping
```
### Ping server to see if it is up.

## Commands
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