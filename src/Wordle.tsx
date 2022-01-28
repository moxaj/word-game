import confetti from 'canvas-confetti';
import React, { useEffect, useReducer } from 'react';
import words from './words';
import './Wordle.scss';

type State = {
  winState: 'guessing' | 'won' | 'failed';
  word: string;
  letters: (string | undefined)[];
  letterIndex: number;
  guessIndex: number;
  totalGuessCount: number;
  guessedInvalidWord: boolean;
};

type Action = {
  type: 'restart';
} | {
  type: 'add-letter';
  letter: string;
} | {
  type: 'remove-letter';
} | {
  type: 'guess'
};

const wordLength = 5;
const maxGuessCount = 7;
const allLetters = [
  'a', 'á', 'b', 'c', 'd', 'e', 'é', 'f', 'g', 'h', 'i', 'í', 'j', 'k', 'l', 'm', 'n',
  'o', 'ó', 'ö', 'ő', 'p', 'q', 'r', 's', 't', 'u', 'ú', 'ü', 'ű', 'v', 'w', 'x', 'y', 'z'
];
const letterLayout = [
  ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ő', 'ú'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'é', 'á', 'ű'],
  ['í', 'y', 'x', 'c', 'v', 'b', 'n', 'm', 'ö', 'ü', 'ó']
];

const createInitialState = (): State => ({
  winState: 'guessing',
  word: words[Math.floor(Math.random() * words.length)],
  letters: new Array(wordLength * maxGuessCount).fill(undefined),
  letterIndex: 0,
  guessIndex: 0,
  totalGuessCount: 0,
  guessedInvalidWord: false
});
const applyAction = (state: State, action: Action): State => {
  let { winState, word, letters, letterIndex, guessIndex, totalGuessCount } = state;
  switch (action.type) {
    case 'restart':
      return createInitialState();
    case 'add-letter':
      if (winState !== 'guessing' || letterIndex === wordLength) {
        return state;
      }

      letters[guessIndex * wordLength + letterIndex++] = action.letter;
      return { ...state, letters, letterIndex, guessedInvalidWord: false };
    case 'remove-letter':
      if (winState !== 'guessing' || letterIndex === 0) {
        return state;
      }

      letters[guessIndex * wordLength + --letterIndex] = undefined;
      return { ...state, letters, letterIndex, guessedInvalidWord: false };
    case 'guess':
      if (winState !== 'guessing') {
        return state;
      }

      const guessedWord = letters.slice(guessIndex * wordLength, (guessIndex + 1) * wordLength).join('');
      if (!words.includes(guessedWord)) {
        return {
          ...state,
          totalGuessCount: totalGuessCount + 1,
          guessedInvalidWord: true
        };
      }

      const won = guessedWord === word;
      return {
        ...state,
        winState: won
          ? 'won'
          : (guessIndex === maxGuessCount - 1 ? 'failed' : 'guessing'),
        letterIndex: 0,
        guessIndex: guessIndex + 1,
        totalGuessCount: totalGuessCount + 1,
        guessedInvalidWord: false
      };
  }
};

const Wordle = () => {
  const [state, dispatch] = useReducer(applyAction, createInitialState());
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
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  useEffect(() => {
    if (state.winState !== 'won') {
      return;
    }

    const timer = setTimeout(() => {
      confetti.create(document.getElementById('confetti-canvas') as HTMLCanvasElement, {})({
        particleCount: 100,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);
  const largeLetterClass = ({ word, letterIndex, guessIndex }: State, letter: string | undefined, globalLetterIndex: number): string => {
    return [
      'letter--large',
      globalLetterIndex >= guessIndex * wordLength
        ? 'letter--unknown'
        : letter === word[globalLetterIndex % wordLength]
          ? 'letter--correct-spot'
          : word.includes(letter ?? '')
            ? 'letter--wrong-spot'
            : 'letter--wrong',
      state.guessedInvalidWord
        && globalLetterIndex >= guessIndex * wordLength
        && globalLetterIndex < (guessIndex + 1) * wordLength
        ? 'letter--invalid-word'
        : undefined,
      globalLetterIndex < guessIndex * wordLength ? 'letter--revealed' : undefined,
      letterIndex > 0 && globalLetterIndex === guessIndex * wordLength + letterIndex - 1 ? 'letter--typed' : undefined
    ].filter(letterClass => letterClass !== undefined).join(' ');
  };
  const largeLetterKey = ({ letters, guessIndex, totalGuessCount }: State, globalLetterIndex: number): string => {
    return [
      globalLetterIndex,
      letters[globalLetterIndex] ?? '?',
      globalLetterIndex >= guessIndex * wordLength ? totalGuessCount : undefined
    ].filter(letterKey => letterKey !== undefined).join(' ');
  };
  const smallLetterClass = ({ word, letters, guessIndex }: State, letter: string): string => {
    return !letters.slice(0, guessIndex * wordLength).includes(letter)
      ? 'letter--unknown'
      : !word.includes(letter)
        ? 'letter--wrong'
        : letters
          .slice(0, guessIndex * wordLength)
          .filter((letter_, globalLetterIndex) => letter === letter_ && letter === word[globalLetterIndex % wordLength]).length > 0
          ? 'letter--correct-spot'
          : 'letter--wrong-spot';
  };
  return (
    <div className='content'>
      <div className='title'>
        Szójáték
      </div>
      <div className='large-letters'>
        {state.letters.map((letter, letterIndex) => (
          <div key={largeLetterKey(state, letterIndex)} className={largeLetterClass(state, letter, letterIndex)}>
            {letter ?? ' '}
          </div>
        ))}
      </div>

      <canvas id='confetti-canvas' width={500} height={500}></canvas>

      <div className='small-letters'>
        {letterLayout.map((letterGroup, index) => (
          <div key={index} className='small-letters-row'>
            {letterGroup.map(letter => (
              <div key={letter} className={`letter--small ${smallLetterClass(state, letter)}`}>
                {letter ?? ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div >
  );
};
export default Wordle;