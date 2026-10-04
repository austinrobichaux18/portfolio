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
    loadComponent: () => import('./pages/us-career-data/us-career-data').then((m) => m.UsCareerData),
    title: 'US Career Data | Austin Robichaux',
  },
];
