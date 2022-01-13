const pingFunc = (args, wordsByLength, gameState) => {
    return {
        reply: "pong",
        gameState: gameState
    };
}

const valid = ["3", "4", "5", "6", "7", "8", "9", "10"];

const startFunc = (args, wordsByLength, gameState) => {
    if (gameState.started) {
        return {
            reply: "game already started",
            gameState: gameState
        }
    } else {
        const wordLength = args[0];
        if (!valid.includes(wordLength)) {
            throw `Cannot create game with word length : ${wordLength}. Please choose number between 3 and 10 inclusive.`;
        }
        const words = wordsByLength[wordLength];
        const randomWord = words[Math.floor(Math.random() * words.length)];
        console.log(`random word ${randomWord} selected`);
        return {
            reply: `Discordle of length ${wordLength} started.`,
            gameState: defaultState(true,wordLength,randomWord,0)
        }
    }
}

const responses = {
    "0": ":black_large_square:",
    "1": ":yellow_square:",
    "2": ":green_square:"
}

const testWord = (guess, answer) => {
    const results = [];
    const letters = new Set();
    for (let i = 0; i < guess.length; i++) {
        const char = guess[i];
        if (char === answer[i]) {
            results.push("2");
        } else if (answer.includes(char)) {
            results.push("1");
        } else {
            results.push("0");
            letters.add(char);
        }
    }
    return [results, letters];
}

const defaultState = (started=false,length=-1,word="",guesses=-1) => {
    return {
        started: started,
        length: length,
        word: word,
        guesses: guesses,
        letters: new Set()
    }
}

const letterText = (failedSet) => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const out = []
    for(const c of letters){
        if(failedSet.has(c)){
            out.push(`~~${c}~~`)
        }else{
            out.push(c)
        }
    }
    return out.join(" ")
}

const guessFunc = (args, wordsByLength, gameState) => {
    if (gameState.started) {
        const guess = args[0];
        if (guess.length != gameState.length) {
            return {
                reply: `Guess ${guess} does not match current word length ${gameState.length}, please retry!`,
                gameState: gameState
            }
        }
        const [testResult, letters] = testWord(args[0], gameState.word);
        const newLetters = new Set([...gameState.letters, ...letters]);
        const numSuccess = testResult.reduce((a, b) => { return b == "2" ? a + 1 : a }, 0);
        const success = numSuccess.toString() === gameState.length;
        const guessCount = gameState.guesses+1;
        let reply = testResult.map(r => responses[r]).join("");
        let newState = {};
        if (success) {
            reply += `\nCongrats on winning the game in ${guessCount} ${guessCount == 1 ? "guess" : "guesses"}!`
            newState = defaultState()
        } else {
            reply += `\n${letterText(newLetters)}`
            newState = { ...gameState, guesses: guessCount, letters : newLetters }
        }
        return {
            reply: reply,
            gameState: newState
        }

    } else {
        return {
            reply: "Please start a game with !start {length} before guessing!",
            gameState: gameState
        }
    }
}

const stateFunc = (args, wordsByLength, gameState) => {
    if (gameState.started) {
        return {
            reply: `game started, length : ${gameState.length}, guesses : ${gameState.guesses}`,
            gameState: gameState
        }
    } else {
        return {
            reply: `game not started, start a game with the !start {length} command.`,
            gameState: gameState
        }
    }
}

module.exports = {
    defaultState : defaultState,
    commands : {
        ping: pingFunc,
        start: startFunc,
        guess: guessFunc,
        state: stateFunc
    }
}