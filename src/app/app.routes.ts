import { Routes } from '@angular/router';

import { Contact } from './pages/contact/contact';
import { Experience } from './pages/experience/experience';
import { Home } from './pages/home/home';
import { Projects} from './pages/projects/projects';

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
        path: 'contact',
        component: Contact,
        title: 'Contact | Austin Robichaux'
    },

    {
        path: '**',
        redirectTo: ''
    }

];
