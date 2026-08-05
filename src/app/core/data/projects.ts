import { Project } from '../models/Project';

export const projects: Project[] = [

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
            'In Development'

    },

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
        ]

    }

];
