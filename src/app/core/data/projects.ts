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
        ],

        deepDive: [
            {
                title: 'Data Model',
                description:
                    'Domain entities are modeled in SQL Server via Entity Framework, kept separate from API-facing DTOs so the underlying schema can evolve without breaking API contracts.'
            },
            {
                title: 'API Design',
                description:
                    'RESTful endpoints follow consistent, versioned contracts, with the API layer kept thin and business logic pushed into the service layer for testability and reuse.'
            },
            {
                title: 'Testing',
                description:
                    'Business-critical logic is covered by unit tests, with integration tests around API endpoints and data access to catch regressions before they reach production.'
            },
            {
                title: 'Security',
                description:
                    'Authentication and authorization follow least-privilege access, with secrets managed outside source control and sensitive data protected in transit and at rest.'
            },
            {
                title: 'CI/CD',
                description:
                    'Changes flow through automated build and release pipelines with test gates before deployment, reducing the risk of shipping regressions to production.'
            }
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
        ],

        deepDive: [
            {
                title: 'Testing',
                description:
                    'Core systems like hex-grid resolution, card effects, and save/load logic are covered by targeted unit tests, backed up by manual playtesting for game feel and balance.'
            },
            {
                title: 'Performance',
                description:
                    'Godot\'s profiler is used to track frame time and memory as systems and content are added, keeping performance consistent as the game grows in complexity.'
            },
            {
                title: 'CI/CD',
                description:
                    'Builds are automated to catch compile errors and broken exports early, rather than relying solely on manual builds before releases.'
            }
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

        deepDive: [
            {
                title: 'Testing',
                description:
                    'The constraint-filtering logic is covered by unit tests validating candidate-narrowing behavior against known letter-feedback scenarios.'
            },
            {
                title: 'Performance',
                description:
                    'The candidate-filtering approach stays fast against the full solution word list, avoiding the need for precomputed guess trees.'
            }
        ],

        links: {
            github: 'https://github.com/austinrobichaux18/Wordle'
        }

    }

];
