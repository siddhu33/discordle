const { test, expect, describe } = require('@jest/globals');
const { defaultState, commands } = require('../commands');

test('Default state function', () => {
  const emptyState = defaultState();
  expect(emptyState).toEqual({
    started: false,
    length: -1,
    word: '',
    guesses: -1,
    letters: new Set(),
  });

  const state2 = defaultState(true, 5, 'tests', 0);
  expect(state2).toEqual({
    started: true,
    length: 5,
    word: 'tests',
    guesses: 0,
    letters: new Set(),
  });
});

describe('Bot Command Tests', () => {
  test('ping works', () => {
    const emptyState = defaultState();
    const response = commands.ping([], {}, emptyState);
    expect(response.reply).toEqual('pong');
  });

  describe('Start Command Tests', () => {
    test('start happy path', () => {
      const emptyState = defaultState();
      const args = ['5'];
      const wordsByLength = { 5: ['tests'] };
      const response = commands.start(args, wordsByLength, emptyState);
      expect(response.reply).toEqual('Discordle of length 5 started.');
      expect(response.gameState).toEqual({
        started: true,
        length: 5,
        word: 'tests',
        guesses: 0,
        letters: new Set(),
      });
    });

    test('start unhappy path', () => {
      const emptyState = defaultState();
      const args = ['2'];
      const wordsByLength = { 5: ['tests'] };
      expect(() => {
        commands.start(args, wordsByLength, emptyState);
      }).toThrowError('Cannot create game with word length : 2. Please choose number between 3 and 16 inclusive.');
    });
  });

  describe('Guess Command Tests', () => {
    test('guess happy path', () => {
      const startedState = {
        started: true,
        length: 5,
        word: 'parts',
        guesses: 0,
        letters: new Set(),
      };
      const args = ['spurt'];
      const wordsByLength = { 5: ['parts'] };
      const response = commands.guess(args, wordsByLength, startedState);
      expect(response.reply.split('\n')[0]).toEqual(':yellow_square::yellow_square::black_large_square::yellow_square::yellow_square:');
      expect(response.gameState.guesses).toEqual(1);
      expect(response.gameState.letters).toEqual(new Set(['u']));
    });

    test('guess victory', () => {
      const startedState = {
        started: true,
        length: 5,
        word: 'parts',
        guesses: 0,
        letters: new Set(),
      };
      const args = ['parts'];
      const wordsByLength = { 5: ['tests'] };
      const response = commands.guess(args, wordsByLength, startedState);
      expect(response.reply.split('\n')[1]).toEqual('Congrats on winning the game in 1 guess!');
    });
  });
});
