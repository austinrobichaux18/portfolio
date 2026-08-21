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

        link: '/projects/enterprise-platforms',

        featured: true,

        overview: [
            'As a Senior Software Engineer Consultant, I designed, developed, and modernized enterprise applications for Fortune 50 and enterprise clients across the Microsoft .NET, Angular, and Azure ecosystem.',
            'Work spanned legacy application modernization, full-stack feature development, and complete architectural redesigns, delivered for large-scale logistics and insurance platforms.'
        ],

        myRole:
            'Led architecture and implementation efforts as the senior engineer on each engagement, from technical design through deployment, while mentoring developers through code reviews and architecture discussions.',

        technicalChallenges: [
            {
                title: 'Legacy Modernization',
                description:
                    'Modernized legacy .NET applications using reusable architectural patterns and components, reducing technical debt while preserving business continuity.'
            },
            {
                title: 'Performance',
                description:
                    'Optimized application workflows, backend services, and SQL queries, reducing processing times by approximately 25% for a large-scale logistics platform.'
            },
            {
                title: 'Scalability',
                description:
                    'Restructured a legacy insurance application architecture to improve scalability, maintainability, and performance ahead of an Azure Cloud deployment.'
            }
        ],

        architecture: [
            'Angular',
            'ASP.NET Core API',
            'Service Layer',
            'Entity Framework',
            'SQL Server'
        ]

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

        link: '/projects/hexing',

        featured: true,

        overview: [
            'Hexing is a roguelike deckbuilding strategy game built solo in Godot using C#, combining hex-based tactical positioning with card-driven combat and run-based progression.',
            'As the sole developer, I own the project end-to-end, from systems design and gameplay programming to UI/UX, tooling, and release planning, applying the same engineering discipline used in enterprise software development to an independent commercial product.'
        ],

        myRole:
            'Sole developer responsible for software architecture, system design, gameplay programming, procedural generation, AI systems, data-driven frameworks, UI/UX, performance optimization, and custom development tools.',

        technicalChallenges: [
            {
                title: 'Hex-Grid System',
                description:
                    'Built the hex-based grid powering tactical positioning, movement, and encounter placement across each run.'
            },
            {
                title: 'Card System',
                description:
                    'Built data-driven frameworks for cards, enemies, and encounters so new content can be added without touching engine code.'
            },
            {
                title: 'Combat & AI Systems',
                description:
                    'Implemented automated combat and enemy AI systems driving hex-based tactical encounters.'
            },
            {
                title: 'Procedural Generation',
                description:
                    'Designed procedural systems for hex-based terrain and run generation to keep each playthrough distinct.'
            },
            {
                title: 'Save System',
                description:
                    'Built a save system that persists run state, progression, and data-driven content across sessions.'
            },
            {
                title: 'UI Architecture',
                description:
                    'Designed the game\'s UI/UX systems to stay responsive and readable as card, combat, and progression state grows in complexity.'
            }
        ],

        architecture: [
            'Godot Engine',
            'C# Gameplay Systems',
            'Data-Driven Content (Cards / Encounters)',
            'Save System'
        ]

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

        link: '/projects/wordle-solver',

        featured: true,

        overview: [
            'An automated Wordle-playing solver that plays the daily puzzle end-to-end, filtering the candidate word list using constraint-based logic derived from each guess\'s letter feedback.',
            'Built to explore how closely a straightforward constraint-satisfaction approach can approach the information-theoretic optimum for the game, without relying on precomputed guess trees, in the spirit of 3Blue1Brown\'s information-theory breakdown of optimal Wordle strategy.'
        ],

        myRole:
            'Designed and built the solver\'s guessing strategy, scoring system, constraint-filtering logic, and browser automation end-to-end.',

        technicalChallenges: [
            {
                title: 'Algorithm Design',
                description:
                    'Implemented constraint-based candidate filtering from letter feedback (correct, present, absent) to narrow the word list after each guess.'
            },
            {
                title: 'Guess Strategy & Scoring',
                description:
                    'Scored candidate guesses by how much they narrow the remaining word list, balancing information gain against the odds of guessing correctly outright.'
            },
            {
                title: 'Browser Automation',
                description:
                    'Used Playwright to drive the live Wordle game, submit guesses, and read back letter-feedback state automatically.'
            }
        ],

        links: {
            github: 'https://github.com/austinrobichaux18/Wordle'
        }

    }

];
