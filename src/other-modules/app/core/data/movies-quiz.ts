import { QuizQuestion } from '../models/QuizQuestion';

export const moviesQuiz: QuizQuestion[] = [
  {
    question: "Who directed the 2010 film 'Inception'?",
    options: {
      a: 'Steven Spielberg',
      b: 'Christopher Nolan',
      c: 'James Cameron',
      d: 'Ridley Scott',
    },
    correctAnswer: 'b',
    explanation: 'Christopher Nolan wrote and directed Inception, released in 2010.',
  },
  {
    question: "Which movie features the character 'Forrest Gump'?",
    options: { a: 'Cast Away', b: 'Forrest Gump', c: 'Big', d: 'Philadelphia' },
    correctAnswer: 'b',
    explanation: 'Forrest Gump (1994) stars Tom Hanks in the title role.',
  },
  {
    question: 'What is the highest-grossing film of all time (unadjusted for inflation)?',
    options: {
      a: 'Avatar',
      b: 'Titanic',
      c: 'Avengers: Endgame',
      d: 'Star Wars: The Force Awakens',
    },
    correctAnswer: 'a',
    explanation:
      'Avatar (2009) reclaimed the top spot after its re-release, grossing over $2.9 billion worldwide.',
  },
];
