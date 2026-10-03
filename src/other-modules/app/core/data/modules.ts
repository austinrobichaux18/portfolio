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
    id: 'localflix',
    title: 'LocalFlix',
    description: 'Browse a folder of shows and episodes and pick up watching where you left off.',
    route: 'localflix',
  },
  {
    id: 'kana',
    title: 'Japanese Kana',
    description:
      'Drill hiragana and katakana with adaptive practice that focuses on the characters you miss most.',
    route: 'kana',
  },
  {
    id: 'investment-calculator',
    title: 'Investment Calculator',
    description:
      'Project ending balance, contributions, and interest from a starting amount and regular contributions, plus a household budget widget and sourced FIRE/retirement advice.',
    route: 'investment-calculator',
  },
];
