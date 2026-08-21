import { Project } from '../models/Project';

export const projects: Project[] = [

    {
        id: 'enterprise-platforms',

        title: 'Enterprise Software Platforms',

        description:
            'Professional software systems built using modern .NET technologies, desktop applications, cloud services, and scalable application architecture.',

        tags: [
            '.NET',
            'C#',
            'Angular',
            'Azure'
        ],

        result:
            'Led an application architecture redesign that generated $30M+ in business impact within the first month of deployment.',

        link: '/experience',

        featured: true

    },

    {
        id: 'hexing',

        title: 'Hexing',

        description:
            'A roguelike deckbuilding strategy game built in Godot using C#. Features hex-based terrain, automated combat, card mechanics, and progression systems.',

        tags: [
            'Godot',
            'C#',
            'Roguelike',
            'Steam'
        ],

        status:
            'In Development',

        result:
            'Sole developer taking a commercial strategy game from concept through release.',

        link: '/games',

        featured: true

    },

    {
        id: 'wordle-solver',

        title: 'Wordle Solver',

        description:
            'An automated Wordle-playing solver that filters candidate words using constraint-based logic from each guess\'s letter feedback.',

        tags: [
            'C#',
            '.NET',
            'Algorithms',
            'Playwright'
        ],

        result:
            'Averages 3.6 guesses per solve, closely approaching the information-theoretic optimum.',

        link: 'https://github.com/austinrobichaux18/Wordle',

        featured: true

    }

];
