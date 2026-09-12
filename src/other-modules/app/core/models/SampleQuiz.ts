import { QuizQuestion } from './QuizQuestion';

export interface SampleQuiz {
  id: string;
  title: string;
  fileName: string;
  questions: QuizQuestion[];
}
