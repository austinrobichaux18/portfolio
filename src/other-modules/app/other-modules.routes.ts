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
];
