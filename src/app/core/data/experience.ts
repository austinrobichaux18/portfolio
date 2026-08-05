import { Experience } from '../models/Experience';

export const experience: Experience[] = [

    {
        id: 'sparq',

        role: 'Senior Software Engineer Consultant',

        company: 'SPARQ',

        startDate: 'April 2023',

        endDate: 'Present',

        description:
            'Developing enterprise software solutions across frontend, backend, and cloud platforms.',

        technologies: [
            'C#',
            '.NET',
            'Angular',
            'TypeScript',
            'Azure',
            'SQL'
        ],

        highlights: [
            'Led software redesign efforts resulting in major business impact',
            'Built scalable applications using modern Microsoft technologies',
            'Worked across full-stack architecture and deployment workflows'
        ]

    },

    {
        id: '365labs',

        role: 'Senior Software Development Engineer',

        company: '365 LABS',

        startDate: 'September 2019',

        endDate: 'April 2023',

        description:
            'Designed and developed production software applications using the Microsoft technology ecosystem.',

        technologies: [
            'C#',
            '.NET',
            'WPF',
            'UWP',
            'SQL'
        ],

        highlights: [
            'Built enterprise desktop applications',
            'Designed reusable software components',
            'Collaborated on large-scale application development'
        ]

    }

];
