import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
        title: 'Austin Robichaux | Senior Software Engineer'
    },

    {
        path: 'experience',
        loadComponent: () => import('./pages/experience/experience').then((m) => m.Experience),
        title: 'Experience | Austin Robichaux'
    },

    {
        path: 'projects',
        loadComponent: () => import('./pages/projects/projects').then((m) => m.Projects),
        title: 'Projects | Austin Robichaux'
    },

    {
        path: 'projects/:id',
        loadComponent: () =>
            import('./pages/project-detail/project-detail').then((m) => m.ProjectDetail),
        title: 'Project Case Study | Austin Robichaux'
    },

    {
        path: 'games',
        loadComponent: () => import('./pages/games/games').then((m) => m.Games),
        title: 'Games | Austin Robichaux'
    },

    {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
        title: 'Contact | Austin Robichaux'
    },

    {
        path: 'resume',
        loadComponent: () => import('./pages/resume/resume').then((m) => m.Resume),
        title: 'Resume | Austin Robichaux'
    },

    {
        path: 'how-it-works',
        loadComponent: () => import('./pages/how-it-works/how-it-works').then((m) => m.HowItWorks),
        title: 'How This Site Works | Austin Robichaux'
    },
    {
        path: '**',
        redirectTo: ''
    }

];
