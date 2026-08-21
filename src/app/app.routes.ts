import { Routes } from '@angular/router';

import { Contact } from './pages/contact/contact';
import { Experience } from './pages/experience/experience';
import { Games } from './pages/games/games';
import { Home } from './pages/home/home';
import { HowItWorks } from './pages/how-it-works/how-it-works';
import { ProjectDetail } from './pages/project-detail/project-detail';
import { Projects } from './pages/projects/projects';
import { Resume } from './pages/resume/resume';

export const routes: Routes = [

    {
        path: '',
        component: Home,
        title: 'Austin Robichaux | Senior Software Engineer'
    },

    {
        path: 'experience',
        component: Experience,
        title: 'Experience | Austin Robichaux'
    },

    {
        path: 'projects',
        component: Projects,
        title: 'Projects | Austin Robichaux'
    },

    {
        path: 'projects/:id',
        component: ProjectDetail,
        title: 'Project Case Study | Austin Robichaux'
    },

    {
        path: 'games',
        component: Games,
        title: 'Games | Austin Robichaux'
    },

    {
        path: 'contact',
        component: Contact,
        title: 'Contact | Austin Robichaux'
    },

    {
        path: 'resume',
        component: Resume,
        title: 'Resume | Austin Robichaux'
    },

    {
        path: 'how-it-works',
        component: HowItWorks,
        title: 'How This Site Works | Austin Robichaux'
    },
    {
        path: '**',
        redirectTo: ''
    }

];
