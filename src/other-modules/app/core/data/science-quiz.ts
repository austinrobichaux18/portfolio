import { QuizQuestion } from '../models/QuizQuestion';

export const scienceQuiz: QuizQuestion[] = [
  {
    question: 'What is the chemical symbol for gold?',
    options: { a: 'Ag', b: 'Au', c: 'Gd', d: 'Go', e: 'Gl', f: 'Gn' },
    correctAnswer: 'b',
    explanation: "Gold's symbol, Au, comes from its Latin name 'aurum'.",
  },
  {
    question: 'What planet is known as the Red Planet?',
    options: { a: 'Venus', b: 'Jupiter', c: 'Mars', d: 'Saturn', e: 'Mercury', f: 'Neptune' },
    correctAnswer: 'c',
    explanation: 'Mars appears red due to iron oxide (rust) covering its surface.',
  },
  {
    question: 'What gas do plants primarily absorb from the atmosphere for photosynthesis?',
    options: {
      a: 'Oxygen',
      b: 'Nitrogen',
      c: 'Hydrogen',
      d: 'Carbon dioxide',
      e: 'Helium',
      f: 'Methane',
    },
    correctAnswer: 'd',
    explanation:
      'Plants absorb carbon dioxide and use sunlight to convert it into glucose and oxygen during photosynthesis.',
  },
];
