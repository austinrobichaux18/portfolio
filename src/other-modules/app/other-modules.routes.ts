import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/other-modules-home/other-modules-home').then((m) => m.OtherModulesHome),
    title: 'Other Modules | Austin Robichaux',
  },
  {
    path: 'quiz',
    loadComponent: () => import('./pages/quiz/quiz').then((m) => m.Quiz),
    title: 'Quiz | Austin Robichaux',
  },
  {
    path: 'localflix',
    loadComponent: () => import('./pages/localflix/localflix').then((m) => m.LocalFlix),
    title: 'LocalFlix | Austin Robichaux',
  },
  {
    path: 'kana',
    loadComponent: () => import('./pages/kana/kana').then((m) => m.Kana),
    title: 'Japanese Kana | Austin Robichaux',
  },
  {
    path: 'investment-calculator',
    loadComponent: () =>
      import('./pages/investment-calculator/investment-calculator').then(
        (m) => m.InvestmentCalculator,
      ),
    title: 'Investment Calculator | Austin Robichaux',
  },
  {
    path: 'us-career-data',
    loadComponent: () =>
      import('./pages/us-career-data/us-career-data').then((m) => m.UsCareerData),
    title: 'US Career Data | Austin Robichaux',
  },
  {
    path: 'learning-resources',
    loadComponent: () =>
      import('./pages/learning-resources/learning-resources').then((m) => m.LearningResources),
    title: 'Japanese Learning Resources | Austin Robichaux',
  },
  {
    path: 'grammar',
    loadComponent: () => import('./pages/grammar/grammar').then((m) => m.Grammar),
    title: 'Japanese Grammar | Austin Robichaux',
  },
  {
    path: 'reference-charts',
    loadComponent: () =>
      import('./pages/reference-charts/reference-charts').then((m) => m.ReferenceCharts),
    title: 'Japanese Reference Charts | Austin Robichaux',
  },
  {
    path: 'music-note-trainer',
    loadComponent: () =>
      import('./pages/music-note-trainer/music-note-trainer').then((m) => m.MusicNoteTrainer),
    title: 'Music Note Trainer | Austin Robichaux',
  },
  {
    path: 'python-for-csharp',
    loadComponent: () =>
      import('./pages/python-for-csharp/python-for-csharp').then((m) => m.PythonForCsharp),
    title: 'Python for C# Devs | Austin Robichaux',
  },
  {
    path: 'my-kitchen',
    loadChildren: () => import('./pages/my-kitchen/my-kitchen.routes').then((m) => m.routes),
    title: 'My Kitchen | Austin Robichaux',
  },
];
