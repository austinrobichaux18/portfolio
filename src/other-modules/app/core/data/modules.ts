import { Module } from '../models/Module';

export const modules: Module[] = [
  {
    id: 'kana',
    title: 'Japanese Kana',
    description:
      'Drill hiragana and katakana with adaptive practice that focuses on the characters you miss most.',
    route: 'kana',
    lastUpdated: '2026-10-02',
    group: 'Japanese',
  },
  {
    id: 'grammar',
    title: 'Japanese Grammar',
    description:
      'Browse foundational Japanese grammar — particles, conjugation forms, sentence structure — and self-test with flashcard-style practice.',
    route: 'grammar',
    lastUpdated: '2026-10-04',
    group: 'Japanese',
  },
  {
    id: 'reference-charts',
    title: 'Japanese Reference Charts',
    description:
      'Browsable vocabulary charts for Japanese covering various topics — paired with a flashcard-style self-test mode to drill recall.',
    route: 'reference-charts',
    lastUpdated: '2026-10-06',
    group: 'Japanese',
  },
  {
    id: 'learning-resources',
    title: 'Japanese Learning Resources',
    description:
      'A searchable, categorized hub of external resources for learning Japanese: dictionaries, grammar guides, graded readers, immersion tools, and community recommendations.',
    route: 'learning-resources',
    lastUpdated: '2026-10-04',
    group: 'Japanese',
  },
  {
    id: 'quiz',
    title: 'Quiz',
    description:
      'Load a folder of quiz JSON files and test yourself, with score history saved back to the folder.',
    route: 'quiz',
    lastUpdated: '2026-09-12',
    group: 'Local Folder',
  },
  {
    id: 'localflix',
    title: 'LocalFlix',
    description: 'Browse a folder of shows and episodes and pick up watching where you left off.',
    route: 'localflix',
    lastUpdated: '2026-10-02',
    group: 'Local Folder',
  },
  {
    id: 'investment-calculator',
    title: 'Investment Calculator',
    description:
      'Project ending balance, contributions, and interest from a starting amount and regular contributions, plus a household budget widget and sourced FIRE/retirement advice.',
    route: 'investment-calculator',
    lastUpdated: '2026-10-03',
    group: 'Finance',
  },
  {
    id: 'us-career-data',
    title: 'US Career Data',
    description:
      'Search, filter, and sort national employment and wage data for ~830 US occupations, straight from the BLS OEWS program.',
    route: 'us-career-data',
    lastUpdated: '2026-10-03',
    group: 'Finance',
  },
];
