
PHASE 2 — Indie Development
20. Reframe /games

The game section should support the professional engineering story.

Position it as:

Indie Development

Possible introductory text:

Outside of enterprise software development, I build and publish my own software and games.

The section should communicate:

C#
Godot
Architecture
UI
Data modeling
Algorithms
Systems design
Independent product development

Do not let games dominate the primary professional narrative.

21. Create a Dedicated Hexing Case Study

Hexing should receive its own detailed project presentation.

Suggested structure:

Hexing

Dungeon Manager · Godot 4 · C#

A roguelike strategy game built from the ground up in Godot using C#.

Sections:

Game

Screenshots and/or video.

Engineering

Potential topics:

Hex-grid system
Card system
Combat system
Save system
Data-driven game objects
Procedural systems
UI architecture
Architecture

Explain major systems.

Development

Show development progression if useful:

Prototype → Systems → Alpha → Release

Technology

Godot C# .NET JSON

Results

Include Steam, GitHub, player metrics, release information, etc. when available.

22. Feature Wordle Solver

The Wordle project can demonstrate algorithmic thinking.

Highlight:

Automated gameplay
Search/guess strategy
Scoring system
Average of approximately 3.6 guesses, if still accurate
Theoretical comparison to the 3Blue1Brown discussion of Wordle strategy
GitHub source
Demo/video where useful

Use this as an algorithmic/software-engineering project rather than presenting it primarily as a game.

PHASE 2 — Portfolio Architecture Case Study
23. Add "How This Site Works"

Create a small technical page or section explaining the portfolio itself.

Potential architecture:

Angular 22
     ↓
Firebase Hosting
     ↓
Firebase Cloud Functions
     ↓
Cloudflare Turnstile
     ↓
Resend

Explain:

Why Angular
Why Firebase
Contact form architecture
Bot protection
Secret management
CI/CD
Testing
Deployment

This makes the portfolio itself an interview talking point.

PHASE 3 — Engineering Quality
24. Automated Testing

Increase test coverage around meaningful behavior.

At minimum consider:

Component tests
Contact form tests
Service tests
Data/model tests
Cloud Function tests

CI should run:

npm test

and:

npm run build

before deployment.

Do not chase arbitrary percentage coverage. Focus on meaningful behavior.
