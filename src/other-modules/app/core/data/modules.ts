import { Module } from '../models/Module';

export const modules: Module[] = [
  {
    id: 'quiz',
    title: 'Quiz',
    description:
      'Load a folder of quiz JSON files and test yourself, with score history saved back to the folder.',
    route: 'quiz',
  },
  {
    id: 'videos',
    title: 'Videos',
    description: 'Browse a folder of shows and episodes and pick up watching where you left off.',
    route: 'videos',
  },
];
