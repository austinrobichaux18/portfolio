import { Experience } from '../models/Experience';

export const experience: Experience[] = [

    {
        id: 'sparq',

        role: 'Senior Software Engineer Consultant',

        company: 'SPARQ',

        startDate: 'April 2023',

        endDate: 'August 2026',

        description:
            'Consulting Senior Software Engineer building and modernizing enterprise applications across the Microsoft .NET, Angular, and Azure ecosystem for enterprise clients.',

        technologies: [
            'C#',
            '.NET',
            'WPF',
            'Angular',
            'ASP.NET Core',
            'SQL Server',
            'Azure'
        ],

        impact: [
            { value: '$30M+', label: 'Business Impact' },
            { value: '~25%', label: 'Faster Processing' }
        ],

        highlights: [
            'Collaborated with product owners, stakeholders, and engineering teams to define technical solutions',
            'Mentored developers through code reviews, architecture discussions, and implementation guidance',
            'Modernized legacy .NET applications using reusable architectural patterns and components'
        ],

        clients: [
            {
                name: 'Fortune 50 Global Logistics Company',

                dateRange: 'July 2024 – August 2026',

                focus: 'Modernizing enterprise applications supporting large-scale global logistics operations',

                work: 'Developed and modernized enterprise applications using WPF, Angular, ASP.NET Core, and SQL Server, and optimized application workflows, backend services, and SQL queries.',

                technologies: [
                    'C#',
                    '.NET',
                    'WPF',
                    'Angular',
                    'ASP.NET Core',
                    'SQL Server'
                ],

                results:
                    'Reduced processing times by approximately 25% while improving responsiveness and long-term maintainability.'
            },

            {
                name: 'National Insurance Company',

                dateRange: 'April 2023 – July 2024',

                focus: 'Leading a legacy insurance application redesign to improve scalability and performance',

                work: 'Led the complete redesign of a .NET insurance application and its underlying software architecture, restructuring it for scalability, maintainability, and performance, and enhancing security through improved authentication and authorization.',

                technologies: [
                    'C#',
                    '.NET',
                    'WPF',
                    'Angular',
                    'ASP.NET Core',
                    'SQL Server',
                    'Azure'
                ],

                results:
                    'Generated $30M+ in profit within the first month after deployment to Azure Cloud, delivered ahead of schedule and under budget.'
            }
        ]

    },

    {
        id: '365labs',

        role: 'Senior Software Development Engineer',

        company: '365 LABS',

        startDate: 'September 2019',

        endDate: 'April 2023',

        description:
            'Senior Software Development Engineer designing and developing production enterprise applications using the Microsoft .NET stack, Azure DevOps, and CI/CD pipelines.',

        technologies: [
            'C#',
            '.NET',
            'WPF',
            'UWP',
            'SQL Server',
            'Azure DevOps',
            'CI/CD',
            'REST APIs'
        ],

        impact: [
            { value: 'Full SDLC', label: 'Concept → Deployment' },
            { value: 'Dynamic UX', label: 'Simplified End-User Validations' }
        ],

        highlights: [
            'Designed and implemented secure authentication & authorization, NuGet packages, and automated release management',
            'Collaborated on large-scale enterprise application development across the full software development lifecycle (SDLC)'
        ],

        accomplishments: [
            'Designed and developed multiple enterprise software projects through the full SDLC that were adopted by thousands of users',
            'Led the development of an intuitive, dynamic UX for validations with a streamlined editing feature, consolidating scattered validation tasks into one convenient location',
            'Redesigned production RESTful APIs into a scalable multi-tenant distributed system, enabling a single API instance to support multiple client databases while leveraging stored procedures and database functions for significant cross-service performance improvements'
        ]

    }

];
