import { QuizQuestion } from '../models/QuizQuestion';

export const sampleQuiz: QuizQuestion[] = [
  {
    question: 'What language is Angular primarily written in?',
    options: { a: 'Python', b: 'TypeScript', c: 'Ruby', d: 'PHP' },
    correctAnswer: 'b',
    explanation:
      'Angular is built with and designed for TypeScript, though it compiles down to JavaScript.',
  },
  {
    question:
      "Which browser API lets a web page read/write files on a user's local folder, with permission?",
    options: {
      a: 'File System Access API',
      b: 'Geolocation API',
      c: 'WebSocket API',
      d: 'Notification API',
    },
    correctAnswer: 'a',
    explanation:
      'The File System Access API (showDirectoryPicker, showOpenFilePicker, etc.) lets a site read and write local files or folders once the user grants permission.',
  },
  {
    question: "In Angular's modern template syntax, which block replaces *ngIf?",
    options: { a: '@switch', b: '@for', c: '@if', d: '@let' },
    correctAnswer: 'c',
    explanation:
      '@if is the built-in control-flow block that replaces the older *ngIf structural directive.',
  },
];
