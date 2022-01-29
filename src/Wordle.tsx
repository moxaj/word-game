import confetti from 'canvas-confetti';
import React, { useEffect, useReducer } from 'react';
import { words } from './words';
import './Wordle.scss';

type Action = {
  type: 'restart';
} | {
  type: 'add-letter';
  letter: string;
} | {
  type: 'remove-letter';
} | {
  type: 'guess';
};

type AnimationEvent = {
  type: 'typed-letter';
} | {
  type: 'guessed-invalid-word';
} | {
  type: 'guessed-valid-word';
} | {
  type: 'guessed-correct-word';
};

type State = {
  winState: 'guessing' | 'won' | 'failed';
  word: string;
  letters: (string | undefined)[];
  letterIndex: number;
  guessIndex: number;
  animationEvents: AnimationEvent[];
  animationEventCounter: number;
};

const wordLength = 5;
const maxGuessCount = 7;
const letterLayout = [
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ő', 'ú'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'é', 'á', 'ű'],
  ['í', 'y', 'x', 'c', 'v', 'b', 'n', 'm', 'ö', 'ü', 'ó']
];
const allLetters = letterLayout.flatMap(letterGroup => letterGroup);

const generateInitialState = (): State => ({
  winState: 'guessing',
  word: words[Math.floor(Math.random() * words.length)],
  letters: new Array(wordLength * maxGuessCount).fill(undefined),
  letterIndex: 0,
  guessIndex: 0,
  animationEvents: [],
  animationEventCounter: 0
});
const applyAction = (state: State, action: Action): State => {
  let { winState, word, letters, letterIndex, guessIndex, animationEvents, animationEventCounter } = state;
  if (animationEvents !== []) {
    state = {
      ...state,
      animationEvents: []
    };
  }

  switch (action.type) {
    case 'restart':
      return generateInitialState();
    case 'add-letter':
      if (winState !== 'guessing' || letterIndex === wordLength) {
        return state;
      }

      letters = letters.slice();
      letters[guessIndex * wordLength + letterIndex] = action.letter;
      return {
        ...state,
        letters,
        letterIndex: letterIndex + 1,
        animationEvents: [{ type: 'typed-letter' }],
        animationEventCounter: animationEventCounter + 1
      };
    case 'remove-letter':
      if (winState !== 'guessing' || letterIndex === 0) {
        return state;
      }

      letters = letters.slice();
      letters[guessIndex * wordLength + letterIndex - 1] = undefined;
      return {
        ...state,
        letters,
        letterIndex: letterIndex - 1
      };
    case 'guess':
      if (winState !== 'guessing') {
        return state;
      }

      const guessedWord = letters.slice(guessIndex * wordLength, (guessIndex + 1) * wordLength).join('');
      if (!words.includes(guessedWord)) {
        return {
          ...state,
          animationEvents: [{ type: 'guessed-invalid-word' }],
          animationEventCounter: animationEventCounter + 1
        };
      }

      const animationEvents: AnimationEvent[] = [{ type: 'guessed-valid-word' }];
      if (guessedWord === word) {
        animationEvents.push({ type: 'guessed-correct-word' });
      }

      return {
        ...state,
        winState: guessedWord === word
          ? 'won'
          : (guessIndex === maxGuessCount - 1 ? 'failed' : 'guessing'),
        letterIndex: 0,
        guessIndex: guessIndex + 1,
        animationEvents,
        animationEventCounter: animationEventCounter + 1
      };
  }
};

export const Wordle = () => {
  const largeLetterClass = ({ word, letterIndex, guessIndex, animationEvents }: State, letter: string | undefined, globalLetterIndex: number): string => {
    return [
      'letter--large',
      // Color
      globalLetterIndex >= guessIndex * wordLength
        ? (letter === undefined ? 'letter--unknown' : 'letter--unknown-filled')
        : letter === word[globalLetterIndex % wordLength]
          ? 'letter--correct-spot'
          : word.includes(letter ?? '')
            ? 'letter--wrong-spot'
            : 'letter--wrong',
      // Type animation
      animationEvents.some(animationEvent => animationEvent.type === 'typed-letter')
        && globalLetterIndex === guessIndex * wordLength + letterIndex - 1
        ? 'letter--typed'
        : undefined,
      // Invalid word animation
      animationEvents.some(animationEvent => animationEvent.type === 'guessed-invalid-word')
        && globalLetterIndex >= guessIndex * wordLength
        && globalLetterIndex < (guessIndex + 1) * wordLength
        ? 'letter--guessed-invalid-word'
        : undefined,
      // Valid word animation
      animationEvents.some(animationEvent => animationEvent.type === 'guessed-valid-word')
        && globalLetterIndex >= (guessIndex - 1) * wordLength
        && globalLetterIndex < guessIndex * wordLength
        ? 'letter--guessed-valid-word'
        : undefined,
    ].filter(letterClass => letterClass !== undefined).join(' ');
  };
  const largeLetterKey = ({ guessIndex, animationEventCounter }: State, globalLetterIndex: number): string => {
    return [
      globalLetterIndex,
      globalLetterIndex >= (guessIndex - 1) * wordLength
        && globalLetterIndex < (guessIndex + 1) * wordLength
        ? animationEventCounter
        : undefined
    ].filter(letterKey => letterKey !== undefined).join(' ');
  };
  const smallLetterClass = ({ word, letters, letterIndex, guessIndex, animationEvents }: State, letter: string): string => {
    return [
      'letter--small',
      // Color
      !letters.slice(0, guessIndex * wordLength).includes(letter)
        ? 'letter--unknown'
        : !word.includes(letter)
          ? 'letter--wrong'
          : letters
            .slice(0, guessIndex * wordLength)
            .filter((letter_, globalLetterIndex) => letter === letter_ && letter === word[globalLetterIndex % wordLength]).length > 0
            ? 'letter--correct-spot'
            : 'letter--wrong-spot',
      // Type animation
      animationEvents.some(animationEvent => animationEvent.type === 'typed-letter' && letters[guessIndex * wordLength + letterIndex - 1] === letter)
        ? 'letter--typed'
        : undefined,
    ].filter(letterClass => letterClass !== undefined).join(' ');
  };
  const smallLetterKey = ({ letters, letterIndex, guessIndex, animationEvents, animationEventCounter }: State, letter: string): string => {
    return [
      letter,
      animationEvents.some(animationEvent => animationEvent.type === 'typed-letter' && letters[guessIndex * wordLength + letterIndex - 1] === letter)
        ? animationEventCounter
        : undefined
    ].filter(letterKey => letterKey !== undefined).join(' ');
  };

  const [state, dispatch] = useReducer(applyAction, generateInitialState());
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const { key, ctrlKey } = event;
      const lowerCaseKey = key.toLocaleLowerCase();
      switch (lowerCaseKey) {
        case 'backspace': dispatch({ type: 'remove-letter' }); break;
        case 'enter': dispatch({ type: ctrlKey ? 'restart' : 'guess' }); break;
        default:
          if (allLetters.includes(lowerCaseKey)) {
            dispatch({ type: 'add-letter', letter: lowerCaseKey });
          }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
  useEffect(() => {
    if (state.animationEvents.some(animationEvent => animationEvent.type === 'guessed-correct-word')) {
      const timer = setTimeout(() => {
        confetti.create(document.getElementById('confetti-canvas') as HTMLCanvasElement, {})({
          particleCount: 100
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <div className='content'>
      <div className='title'>
        Szójáték
      </div>
      <div className='controls'>
        <b>Backspace</b>: karakter törlése<br />
        <b>Enter</b>: szó bevitele<br />
        <b>Ctrl + Enter</b>: új feladvány kérése<br />
      </div>
      <div className='large-letters'>
        {state.letters.map((letter, letterIndex) => (
          <div key={largeLetterKey(state, letterIndex)} className={largeLetterClass(state, letter, letterIndex)}>
            {letter ?? ' '}
          </div>
        ))}
      </div>
      <div className='messages'>
        {state.winState === 'failed' && <div>
          A megoldás: <b>{state.word}</b>.
        </div>}
        {state.winState === 'won' && <div>
          <b>Szép munka!</b>
        </div>}
      </div>
      <div className='small-letters'>
        {letterLayout.map((letterGroup, index) => (
          <div key={index} className='small-letters-row'>
            {letterGroup.map(letter => (
              <div key={smallLetterKey(state, letter)} className={smallLetterClass(state, letter)} onClick={() => dispatch({ type: 'add-letter', letter })}>
                {letter ?? ''}
              </div>
            ))}
          </div>
        ))}
      </div>

      <canvas id='confetti-canvas' width={1000} height={1000}></canvas>
    </div >
  );
};