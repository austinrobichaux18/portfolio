import { SampleQuiz } from '../models/SampleQuiz';
import { sampleQuiz as angularBasicsQuiz } from './sample-quiz';
import { generalKnowledgeQuiz } from './general-knowledge-quiz';
import { moviesQuiz } from './movies-quiz';
import { scienceQuiz } from './science-quiz';

export const sampleQuizzes: SampleQuiz[] = [
  {
    id: 'angular-basics',
    title: 'Angular Basics',
    fileName: 'angular-basics.json',
    questions: angularBasicsQuiz,
  },
  {
    id: 'general-knowledge',
    title: 'General Knowledge',
    fileName: 'general-knowledge.json',
    questions: generalKnowledgeQuiz,
  },
  {
    id: 'movies',
    title: 'Movies',
    fileName: 'movies.json',
    questions: moviesQuiz,
  },
  {
    id: 'science',
    title: 'Science',
    fileName: 'science.json',
    questions: scienceQuiz,
  },
];
