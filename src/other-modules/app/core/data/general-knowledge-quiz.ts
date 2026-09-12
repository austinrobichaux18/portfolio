import { QuizQuestion } from '../models/QuizQuestion';

export const generalKnowledgeQuiz: QuizQuestion[] = [
  {
    question: 'What is the capital of France?',
    options: { a: 'Berlin', b: 'Madrid', c: 'Paris', d: 'Rome' },
    correctAnswer: 'c',
    explanation: 'Paris has been the capital of France since the 10th century.',
  },
  {
    question: 'How many continents are there on Earth?',
    options: { a: '5', b: '6', c: '7', d: '8' },
    correctAnswer: 'c',
    explanation:
      'The seven continents are Africa, Antarctica, Asia, Australia, Europe, North America, and South America.',
  },
  {
    question: 'Which ocean is the largest by surface area?',
    options: { a: 'Atlantic', b: 'Indian', c: 'Arctic', d: 'Pacific' },
    correctAnswer: 'd',
    explanation:
      "The Pacific Ocean covers about a third of the Earth's surface, making it the largest ocean.",
  },
];
