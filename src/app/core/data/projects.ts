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

    },

    {
        id: 'quiz',

        title: 'Quiz',

        description:
            'A browser-based quiz runner that reads and writes quiz files and score history directly to a local folder, no backend or accounts, built on the File System Access API.',

        tags: [
            'Angular',
            'TypeScript',
            'File System Access API',
            'IndexedDB'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/quiz',

        overview: [
            'Quiz loads a folder of JSON quiz files straight from disk via the File System Access API, no upload step and no server, then writes score history back into that same folder as quiz-scores.json.',
            'Built to explore what a fully local, no-backend web app can do when the browser is given direct (permissioned) read/write access to the filesystem, instead of defaulting to a database and an API layer.'
        ],

        myRole:
            'Designed and built the file-access flow, quiz-taking state machine, timing instrumentation, and score persistence end-to-end.',

        technicalChallenges: [
            {
                title: 'File System Access API Lifecycle',
                description:
                    'Persists the picked directory handle in IndexedDB so returning visitors skip the folder picker, then re-requests readwrite permission on each return visit since a stored handle doesn\'t carry permission forever.'
            },
            {
                title: 'Validating Untrusted JSON',
                description:
                    'Runtime type guards check arbitrary quiz files and quiz-scores.json against the expected shape before trusting them, rather than assuming well-formed input from disk.'
            },
            {
                title: 'Per-Question Timing',
                description:
                    'Tracks elapsed time per question and overall via signals and an interval timer, surfaced on the results screen without affecting the scoring logic itself.'
            },
            {
                title: 'Mouse/Keyboard Navigation',
                description:
                    'A global listener maps browser back/forward mouse buttons to previous/next question or screen, consistently across every view state in the quiz flow.'
            }
        ],

        architecture: [
            'File System Access API (directory picker)',
            'IndexedDB (persisted folder handle)',
            'Runtime JSON validation layer',
            'Angular signals (quiz state machine)',
            'JSON write-back (quiz-scores.json)'
        ],

        deepDive: [
            {
                title: 'State Modeling',
                description:
                    'A single view-state signal drives every screen transition explicitly, keeping the sample/folder/quiz-taking flows mutually exclusive by construction instead of juggling several boolean flags.'
            },
            {
                title: 'Testing',
                description:
                    'Covered by component and data-layer specs validating quiz/attempt shape checking independently of the UI.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/quiz',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/quiz'
        }

    },

    {
        id: 'localflix',

        title: 'LocalFlix',

        description:
            'A local media browser and player for a folder of video files that generates and caches its own episode thumbnails and resumes playback exactly where you left off.',

        tags: [
            'Angular',
            'File System Access API',
            'Canvas API',
            'HTML5 Video'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/localflix',

        overview: [
            'LocalFlix turns a folder of show/episode video files into a Netflix-style browsing experience entirely client-side: no uploads, no transcoding server, no media database.',
            'It generates its own poster art and episode thumbnails by sampling frames directly from the video files in the browser, and tracks per-episode watch progress in a history file written back to the same folder.'
        ],

        myRole:
            'Designed and built the folder traversal, thumbnail generation pipeline, playback/resume logic, and history persistence end-to-end.',

        technicalChallenges: [
            {
                title: 'Client-Side Thumbnail Generation',
                description:
                    'Seeks a detached, never-DOM-attached <video> element partway into a file, draws the frame to an offscreen canvas, and encodes it to a JPEG blob, then caches the result in a hidden folder via the File System Access API so it\'s never regenerated.'
            },
            {
                title: 'Bounded-Concurrency Pipeline',
                description:
                    'A small worker-pool pattern processes the shared queue of episodes so thumbnail generation never tries to open dozens of video files at once.'
            },
            {
                title: 'Stale-Write Protection',
                description:
                    'Generation counters are bumped on every folder or subfolder change; in-flight async thumbnail work checks the counter before writing results, so slow background work from a folder the user already left can\'t corrupt the view they\'re now on.'
            },
            {
                title: 'Resumable Watch History',
                description:
                    'Playback position, duration, and completion are written to a per-show history.json keyed by path relative to the show root, throttled to once every 5 seconds, so nested season folders never collide.'
            }
        ],

        architecture: [
            'File System Access API',
            'Recursive directory traversal (natural sort)',
            'Canvas-based thumbnail extraction (cached to disk)',
            'HTML5 video playback',
            'history.json progress persistence'
        ],

        deepDive: [
            {
                title: 'Memory Management',
                description:
                    'Every generated thumbnail and video object URL is tracked and explicitly revoked on folder change or component teardown, avoiding a classic blob-URL leak in a single-page app that never fully reloads.'
            },
            {
                title: 'Testing',
                description:
                    'Covered by component specs validating folder/show/episode state transitions.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/localflix',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/localflix'
        }

    },

    {
        id: 'kana',

        title: 'Japanese Kana Trainer',

        description:
            'An adaptive hiragana/katakana drilling tool that weights which characters you\'re quizzed on by a time-decayed miss rate, rather than drilling randomly or in a fixed order.',

        tags: [
            'Angular',
            'TypeScript',
            'SVG',
            'Speech Synthesis API'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/kana',

        overview: [
            'A spaced-practice tool for hiragana and katakana that adapts in real time to what the user is actually struggling with, instead of cycling through characters in a fixed or purely random order.',
            'Per-character accuracy and response time are tracked across sessions, with a custom weighted-selection algorithm biasing practice toward the characters that need it most.'
        ],

        myRole:
            'Designed and built the adaptive selection algorithm, practice-session state machine, stats/history persistence, and SVG trend visualization end-to-end.',

        technicalChallenges: [
            {
                title: 'Weighted-Random Adaptive Selection',
                description:
                    'Computes a per-character weight from a Laplace-smoothed miss rate (misses plus a time penalty, plus one, over attempts plus two), so characters answered wrong or slowly are sampled more often, while never repeating the immediately-previous character.'
            },
            {
                title: 'Response Time as a Soft Penalty',
                description:
                    'Average response time beyond a 2-second healthy threshold converts into a capped penalty folded into the same weight as misses, so stalling on a character pulls it back into rotation even when it\'s eventually answered correctly.'
            },
            {
                title: 'Sample-Size-Aware Mastery Badges',
                description:
                    'A flat miss-rate cutoff marks a character "struggling" immediately, but "mastered" status additionally requires a minimum attempt count, so one lucky guess can\'t earn the same badge a single miss can trigger.'
            },
            {
                title: 'Custom SVG Trend Chart',
                description:
                    'Session accuracy history is rendered as a hand-built line chart, manual path generation, hover tooltips, and gridlines, with no charting library dependency.'
            }
        ],

        architecture: [
            'Static kana dataset',
            'Weighted selection algorithm',
            'Angular signals (practice loop)',
            'Per-character stats + session history',
            'LocalStorage persistence + JSON import/export'
        ],

        deepDive: [
            {
                title: 'Algorithm Correctness',
                description:
                    'The character-matching, weighting, and persistence logic are unit-tested in isolation from the component, independent of the UI.'
            },
            {
                title: 'Progressive Enhancement',
                description:
                    'Speech Synthesis API support is feature-detected and used for optional audio playback of the current character, with a graceful no-op fallback when unavailable.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/kana',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/kana'
        }

    },

    {
        id: 'investment-calculator',

        title: 'Investment Calculator',

        description:
            'A compound-interest and retirement-planning calculator with an attached household-budget estimator that models real 2025 U.S. federal tax brackets, FICA, and state tax rates rather than a simplified rule of thumb.',

        tags: [
            'Angular',
            'TypeScript',
            'SVG',
            'Financial Modeling'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/investment-calculator',

        overview: [
            'Projects an investment\'s ending balance, contributions, and interest from a starting amount, contribution schedule, and compounding frequency, then discounts the result to today\'s purchasing power.',
            'A companion household-budget widget estimates real take-home pay, using actual 2025 IRS tax brackets, FICA rules, and state tax rates, to translate a salary into a realistic monthly contribution figure instead of a guessed one.'
        ],

        myRole:
            'Designed and built the compounding engine, tax/budget calculator, SVG charts, and scenario history end-to-end.',

        technicalChallenges: [
            {
                title: 'Month-by-Month Compounding Engine',
                description:
                    'Supports five compounding frequencies plus continuous compounding, converted to a per-month growth factor, with contributions applied at either the beginning or end of each period and an optional delay while emergency-fund buffers are filled first.'
            },
            {
                title: 'Real vs. Nominal Projections',
                description:
                    'Every yearly balance is separately discounted back to today\'s purchasing power using an inflation-rate input, so long-horizon projections aren\'t misleadingly large in future dollars.'
            },
            {
                title: 'Progressive Tax Bracket Calculator',
                description:
                    'Implements the actual 2025 IRS federal brackets and standard deduction for single vs. married filing jointly, plus FICA (Social Security capped at the wage base, uncapped Medicare) and a per-state effective tax rate, to estimate real take-home pay from gross income.'
            },
            {
                title: 'Hand-Rolled SVG Visualizations',
                description:
                    'A stacked bar chart (contributions vs. interest per year) and a pie chart (principal/contributions/interest breakdown) are built from scratch with manual polar-to-Cartesian arc-path math, no charting library.'
            }
        ],

        architecture: [
            'Pure calculation functions (investment math, tax/budget math)',
            'Angular signals / computed() reactive pipeline',
            'Hand-built SVG charts',
            'LocalStorage-backed scenario history'
        ],

        deepDive: [
            {
                title: 'Separation of Concerns',
                description:
                    'All financial math lives in plain, dependency-free functions decoupled from the component, making it directly unit-testable and reusable outside the UI.'
            },
            {
                title: 'Testing',
                description:
                    'The investment math, budget/tax math, persistence layer, and component are each covered by their own spec file.'
            },
            {
                title: 'Data Sourcing',
                description:
                    'Tax brackets, FICA rates, and income/spending averages are pulled from and cited to primary sources (IRS, SSA, BLS Consumer Expenditure Survey), with inline documentation of methodology and known limitations.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/investment-calculator',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/investment-calculator'
        }

    },

    {
        id: 'us-career-data',

        title: 'US Career Data',

        description:
            'A searchable, filterable explorer for ~830 U.S. occupations\' real BLS wage and employment-outlook data, with CSV export, a shareable-link-encoded filter state, and a quadrant scatter chart.',

        tags: [
            'Angular',
            'RxJS',
            'TypeScript',
            'Data Visualization'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/us-career-data',

        overview: [
            'Lets a visitor search, filter, sort, and compare national employment and wage data for roughly 830 U.S. occupations, sourced directly from the BLS Occupational Employment and Wage Statistics and Employment Projections programs.',
            'Filter state, sort order, and search terms all round-trip through a compact, shareable URL, so a specific filtered view can be bookmarked or sent to someone else, not just screenshotted.'
        ],

        myRole:
            'Designed and built the data-join pipeline, filtering/sorting engine, shareable-state encoding, CSV export, and scatter chart end-to-end.',

        technicalChallenges: [
            {
                title: 'Large Client-Side Dataset Pipeline',
                description:
                    'Joins two ~830-row JSON datasets (wage data and outlook data) by occupation code via a single forkJoin, then filters through seven category facets, six numeric range filters, and free-text search, all computed reactively.'
            },
            {
                title: 'Shareable, URL-Encoded Filter State',
                description:
                    'The entire filter/sort configuration round-trips through a compact JSON schema with short keys, URI-encoded into a single query parameter, validated by a defensive runtime type guard before anything from a URL or localStorage is trusted.'
            },
            {
                title: 'Domain-Specific Ordinal Sorting',
                description:
                    'Education level, experience required, AI exposure, and job outlook sort by a domain-specific rank order (e.g. high school diploma below bachelor\'s below doctorate) instead of alphabetically, matching how the data is actually meant to be read.'
            },
            {
                title: 'Custom Resizable Data Grid',
                description:
                    'A 14-column table with drag-to-resize columns, a show/hide column picker, and a synced top/bottom scrollbar, implemented without a grid library.'
            },
            {
                title: 'Quadrant Scatter Chart',
                description:
                    'Median salary against education-level rank, dot radius scaled by employment share and dot color by AI-exposure tier, built from scratch and plotted from the exact same filtered dataset as the table so chart and table always agree.'
            }
        ],

        architecture: [
            'Static BLS OEWS + Employment Projections datasets',
            'HttpClient + forkJoin (join by occupation code)',
            'Angular signals (filter/sort/pagination state)',
            'URL/localStorage-encoded shareable filter state',
            'CSV export / SVG scatter chart'
        ],

        deepDive: [
            {
                title: 'Data Provenance Transparency',
                description:
                    'A column glossary explicitly separates what\'s real sourced BLS data (education, experience, wage percentiles, projected growth) from what\'s this site\'s own rule-based estimate (job environment, AI exposure, remote-work potential), rather than presenting both as equally authoritative.'
            },
            {
                title: 'Performance',
                description:
                    'Filtering, sorting, and pagination are all derived through computed(), so the signal graph only recomputes when an actual dependency changes, even with ~830 rows re-filtered on every keystroke.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/us-career-data',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/us-career-data'
        }

    },

    {
        id: 'learning-resources',

        title: 'Japanese Learning Resources',

        description:
            'A searchable, categorized hub of external resources for learning Japanese, with live client-side filtering across dictionaries, grammar guides, graded readers, immersion tools, and community-sourced recommendation lists.',

        tags: [
            'Angular',
            'TypeScript',
            'Signals'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/learning-resources',

        overview: [
            'Collects external Japanese-learning resources (dictionary, grammar guides, comprehensible input, graded readers, Anki decks, podcasts, and community recommendation lists) into one categorized, searchable reference page.',
            'Built as the first of this site\'s "Other Modules" content-only tools, where the value is in the organization and curation of the list rather than any interactive practice mechanic.'
        ],

        myRole:
            'Designed the data model, wrote the categorized resource data, and built the filtering UI end-to-end.',

        technicalChallenges: [
            {
                title: 'Live, Cross-Field Search',
                description:
                    'A single search box filters resources by title or description text across every category simultaneously via a computed() signal, hiding any category left with zero matches rather than showing empty sections.'
            },
            {
                title: 'Data-Driven Content Model',
                description:
                    'Resources are plain data (category, title, optional URL, optional note) rather than hardcoded template markup, so adding or recategorizing a resource is a data-file edit, not a template change.'
            }
        ],

        architecture: [
            'Static categorized resource data (core/data)',
            'Angular signals (search filter state)',
            'computed() cross-field search'
        ],

        deepDive: [
            {
                title: 'Graceful Handling of Missing URLs',
                description:
                    'A resource\'s URL is optional in the model — entries with no stable public link (like a named Anki deck) render as plain text instead of a dead or guessed link.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/learning-resources',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/learning-resources'
        }

    },

    {
        id: 'grammar',

        title: 'Japanese Grammar',

        description:
            'A browsable reference for foundational Japanese grammar — particles, conjugation forms, and sentence structure — paired with a flashcard-style self-test mode to drill recall.',

        tags: [
            'Angular',
            'TypeScript',
            'Signals'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/grammar',

        overview: [
            'Collects foundational Japanese grammar points (particles, sentence enders, verb conjugation forms, negation, verb stem swaps, etc.) into a categorized, searchable reference, plus a flashcard practice mode to actively test recall instead of just re-reading.',
            'Extends the "Other Modules" content-tool pattern established by the Japanese Learning Resources module, adding a lightweight practice mechanic on top of the reference content.'
        ],

        myRole:
            'Designed the data model, transcribed and structured the grammar reference content, and built both the reference and practice UI end-to-end.',

        technicalChallenges: [
            {
                title: 'Shared Reference/Practice Data Model',
                description:
                    'Grammar points are plain data (category, term, summary, optional examples) consumed by two different views — a searchable reference list and a flattened, shuffled flashcard deck — without duplicating any content between them.'
            },
            {
                title: 'Self-Scoring Flashcard Session',
                description:
                    'The practice mode shuffles every grammar point into a one-pass deck, lets the user self-judge recall ("knew it" / "missed it") after revealing the answer, and reports a session accuracy score at the end — state managed entirely with signals, no persistence needed for a short per-visit drill.'
            }
        ],

        architecture: [
            'Static grammar reference data (core/data)',
            'Angular signals (search filter state, flashcard deck/session state)',
            'computed() cross-field search and derived session stats'
        ],

        deepDive: [
            {
                title: 'Data-Driven Content Model',
                description:
                    'Grammar points are organized by category as plain data rather than hardcoded template markup, so adding or editing a grammar point is a data-file edit, not a template change — consistent with the pattern used across this site\'s other content-driven modules.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/grammar',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/grammar'
        }

    },

    {
        id: 'reference-charts',

        title: 'Japanese Reference Charts',

        description:
            'Browsable vocabulary charts for Japanese — days of the week and calendar terms, greetings, question words, numbers and counters, months and seasons, time expressions, colors and shapes, family terms, weather terms, body parts, and food and drink basics — paired with a flashcard-style self-test mode to drill recall.',

        tags: [
            'Angular',
            'TypeScript',
            'Signals'
        ],

        result:
            'A self-contained tool in this site\'s "Other Modules" section.',

        link: '/projects/reference-charts',

        overview: [
            'Collects Japanese vocabulary into category-organized, searchable reference charts — tables rather than prose — starting with days of the week (each paired with the elemental kanji it\'s built from) and calendar/relative-day vocabulary, plus a flashcard practice mode over the same data.',
            'Kanji render with inline furigana (readings in a <ruby>/<rt> annotation above each character) instead of a separate romaji/hiragana column, so the chart reads the way a real Japanese reference does.',
            'Designed as an open-ended module: each vocabulary category (greetings, numbers, colors, etc.) slots in as another entry in the same data model without touching the page template, so future categories are a data-file edit, not new UI.'
        ],

        myRole:
            'Designed the data model, transcribed and verified the vocabulary reference content, and built both the chart and practice UI end-to-end.',

        technicalChallenges: [
            {
                title: 'Column-Agnostic Chart Rendering',
                description:
                    'Each reference table carries its own column definitions (key + label) alongside its rows, so the template renders any table\'s headers and cells generically — a category with different columns needs no template change.'
            },
            {
                title: 'Per-Character Furigana as Data',
                description:
                    'A cell is either plain text or an array of {text, reading} segments; the template renders segments with a reading as a <ruby>/<rt> pair and segments without one as plain text, so a compound word like 日曜日 can carry a different reading per kanji (にち／よう／び) without any string-parsing logic.'
            },
            {
                title: 'Shared Chart/Practice Data Model',
                description:
                    'A table opts into practice mode by naming which of its own columns is the flashcard "front"; the rest of that row\'s columns become the "back" automatically, so one data file drives both the browsable chart and a flattened, shuffled flashcard deck with no duplicated content.'
            }
        ],

        architecture: [
            'Static, column-described reference-chart data (core/data)',
            'Angular signals (search filter state, flashcard deck/session state)',
            'computed() cross-column search and derived session stats'
        ],

        deepDive: [
            {
                title: 'Data-Driven Content Model',
                description:
                    'Vocabulary categories, tables, and flashcard eligibility are all plain data rather than hardcoded template markup, so adding a new chart or vocabulary category is a data-file edit, not a template change — consistent with the pattern used across this site\'s other content-driven modules.'
            }
        ],

        links: {
            demo: 'https://austinrobichaux.com/other-modules/reference-charts',
            github: 'https://github.com/austinrobichaux18/portfolio/tree/master/src/other-modules/app/pages/reference-charts'
        }

    }

];
