const VALID_LENGTHS = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
const LETTERS = Array.from('abcdefghijklmnopqrstuvwxyz');
const RESPONSE_EMOJI = {
  0: ':black_large_square:',
  1: ':yellow_square:',
  2: ':green_square:',
};

const defaultState = (started = false, length = -1, word = '', guesses = -1) => ({
  started,
  length,
  word,
  guesses,
  letters: new Set(),
});

const pingFunc = (_args, _wordsByLength, gameState) => ({
  reply: 'pong',
  gameState,
});

const startFunc = (args, wordsByLength, gameState) => {
  if (gameState.started) {
    return {
      reply: 'game already started',
      gameState,
    };
  }
  const wordLength = args[0];
  if (!VALID_LENGTHS.includes(wordLength)) {
    throw new Error(`Cannot create game with word length : ${wordLength}. Please choose number between 3 and 16 inclusive.`);
  }
  const words = wordsByLength[wordLength];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  console.log(`random word ${randomWord} selected`);
  return {
    reply: `Discordle of length ${wordLength} started.`,
    gameState: defaultState(true, parseInt(wordLength, 10), randomWord, 0),
  };
};

const testWord = (guess, answer) => {
  const results = [];
  const letters = new Set();
  for (let i = 0; i < guess.length; i += 1) {
    const char = guess[i];
    if (char === answer[i]) {
      results.push('2');
    } else if (answer.includes(char)) {
      results.push('1');
    } else {
      results.push('0');
      letters.add(char);
    }
  }
  return [results, letters];
};

// const letterText = (failedSet) => \
// LETTERS.map((l) => (failedSet.has(l) ? `~~${l}~~` : l)).join(' ');

const letterText = (failedSet) => LETTERS.filter((l) => !failedSet.has(l)).join(' ');

const guessFunc = (args, _wordsByLength, gameState) => {
  if (gameState.started) {
    const guess = args[0];
    if (guess.length !== gameState.length) {
      return {
        reply: `Guess ${guess} does not match current word length ${gameState.length}, please retry!`,
        gameState,
      };
    }
    const [testResult, letters] = testWord(args[0], gameState.word);
    const newLetters = new Set([...gameState.letters, ...letters]);
    const numSuccess = testResult.reduce((a, b) => (b === '2' ? a + 1 : a), 0);
    const success = numSuccess === gameState.length;
    const guessCount = gameState.guesses + 1;
    let reply = testResult.map((r) => RESPONSE_EMOJI[r]).join('');
    let newState = {};
    if (success) {
      reply += `\nCongrats on winning the game in ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'}!`;
      newState = defaultState();
    } else {
      reply += `\n${letterText(newLetters)}`;
      newState = { ...gameState, guesses: guessCount, letters: newLetters };
    }
    return {
      reply,
      gameState: newState,
    };
  }
  return {
    reply: 'Please start a game with !start {length} before guessing!',
    gameState,
  };
};

const stateFunc = (_args, _wordsByLength, gameState) => {
  console.log('gameState: %s', gameState);
  if (gameState.started) {
    return {
      reply: `game started, length : ${gameState.length}, guesses : ${gameState.guesses}`,
      gameState,
    };
  }
  return {
    reply: 'game not started, start a game with the !start {length} command.',
    gameState,
  };
};

module.exports = {
  defaultState,
  commands: {
    ping: pingFunc,
    start: startFunc,
    guess: guessFunc,
    state: stateFunc,
  },
};
