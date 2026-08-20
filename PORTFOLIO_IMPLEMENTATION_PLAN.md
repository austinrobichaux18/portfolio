Austin Robichaux Portfolio — Implementation Plan
Purpose

This document is the implementation roadmap for improving the Austin Robichaux professional portfolio website.

The primary goal is to turn the existing Angular portfolio into a polished, recruiter-facing professional engineering portfolio that:

Communicates Austin's professional value within 30 seconds.
Clearly establishes him as a Senior Software Engineer.
Highlights measurable business impact and enterprise engineering experience.
Demonstrates technical depth through projects and architecture.
Showcases AI-assisted development and Claude certification.
Uses indie game development as supporting evidence of independent engineering ability.
Provides an excellent recruiter/interviewer experience.
Demonstrates professional frontend, cloud, security, testing, and CI/CD practices through the portfolio itself.

Do not build unnecessary features merely because they are possible. Prioritize clarity, credibility, performance, maintainability, and professional presentation.

Current Application
Existing Stack
Frontend: Angular 22
Architecture: Angular standalone components
Language: TypeScript
Styling: SCSS
Backend: Firebase Cloud Functions, 2nd generation, TypeScript
Hosting: Firebase Hosting
CI/CD: GitHub Actions
Contact form bot protection: Cloudflare Turnstile
Contact email delivery: Resend
Testing: Vitest through Angular CLI's unit-test builder
Existing Routes
/ — Home
/experience — Professional work history
/projects — Featured software and engineering projects
/games — Indie game development projects
/resume — Resume viewer/download
/contact — Contact form
Existing Architecture

Static portfolio content is currently defined under:

src/app/core/data/

Models are under:

src/app/core/models/

Shared layout:

src/app/layout/

Route-level components:

src/app/pages/

Reusable presentation components:

src/app/shared/

Do not introduce an unnecessary backend/API/database for static portfolio content. Static TypeScript data is appropriate unless a specific feature requires dynamic data.

Existing Cloud Function

sendContactEmail

Responsibilities:

Verify Cloudflare Turnstile token.
Send contact message through Resend.

Secrets:

TURNSTILE_SECRET
RESEND_API_KEY
Existing Deployment

Firebase Hosting deploys automatically through GitHub Actions.

Current behavior:

Push to master → production deployment
Pull request → Firebase preview channel

Cloud Functions are currently deployed manually.

Eventually evaluate adding Functions deployment to the production GitHub Actions workflow after tests/builds succeed.

Overall Design Principle

The portfolio should feel like the website of a senior professional software engineer, not a generic developer portfolio template.

Prioritize:

Professionalism
Clarity
Strong typography
Excellent spacing
Responsive design
Accessibility
Performance
Subtle animation
Strong information hierarchy
Real engineering evidence
Quantifiable accomplishments

Avoid:

Excessive animations
Particle backgrounds
Skill percentage bars
Fake proficiency percentages
Giant walls of text
Excessive icons
Gimmicky effects
Generic motivational copy
Overly elaborate navigation
Unnecessary APIs
Features that are difficult to maintain
Primary Positioning

The site should consistently communicate this professional identity:

Senior Software Engineer

Core technical positioning:

C#
.NET
Angular
SQL Server
Azure
TypeScript
Full-stack development
Enterprise software
AI-assisted development

Supporting differentiators:

Measurable business impact
Software modernization
Independent software/game development
Anthropic Claude certification
Cloud and CI/CD experience

A visitor should leave with the impression:

Austin is an experienced senior software engineer who can build and modernize real enterprise software, work across the full stack, use cloud and DevOps effectively, and leverage modern AI development tools intelligently.

PHASE 1 — Recruiter Conversion
Priority: Highest

These changes should be completed first.

1. Redesign the Home Page

The home page should immediately communicate:

Who Austin is
What he does
What technologies he specializes in
Why he is credible
That he is currently open to opportunities
How to contact him
Hero

Recommended structure:

Austin Robichaux

Senior Software Engineer

.NET • C# • Angular • SQL Server • Azure • AI-Assisted Development

Professional summary:

Senior Software Engineer with 6+ years of experience building, modernizing, and deploying enterprise software. Specializing in the Microsoft .NET ecosystem, full-stack development, cloud applications, and modern development practices.

Primary CTA buttons:

View Experience
View Projects
Download Resume
Contact Me

Secondary links:

LinkedIn
GitHub
Email

Do not overwhelm the hero with too many buttons.

2. Add a Proof / Metrics Strip

Immediately below the hero, add concise credibility indicators.

Potential metrics:

6+ Years Experience
$30M+ Business Impact
.NET / C#
Azure
Anthropic Claude Certified

Only display numbers that are accurate and defensible.

The $30M+ figure should be used prominently if supported by the resume/professional experience.

3. Add "What I Do"

Translate technical skills into professional capabilities.

Recommended cards:

Enterprise Software

Designing and developing large-scale applications using C#, .NET, SQL Server, Angular, and Azure.

Full-Stack Development

Building applications across the entire stack, from database and APIs through frontend experiences.

Software Modernization

Modernizing legacy applications and architectures while maintaining reliability and business continuity.

Cloud & DevOps

Deploying and maintaining applications using Azure, Firebase, CI/CD, and modern development workflows.

AI-Assisted Development

Using AI development tools such as Claude to accelerate development, debugging, documentation, testing, refactoring, and architectural work.

Keep this section concise.

4. Add Featured Projects to Home

Do not require recruiters to navigate to /projects before seeing evidence of technical work.

Feature approximately three projects.

Prioritize projects based on career value, not necessarily personal preference.

Potential structure:

Professional/enterprise engineering project
Hexing
Wordle solver / algorithmic project

Each project card should contain:

Project name
One-line description
Technologies
Short result/value statement
View Case Study link
5. Add Certifications to Home

Make certifications visible without allowing them to dominate the site.

Current important certification:

Claude Certified Developer – Foundations

Anthropic

August 2026

Include a link to the credential when available.

Additional Claude certifications can be added later.

6. Add Open-to-Opportunities Status

Display a professional availability statement.

Recommended wording:

Currently exploring Senior Software Engineer opportunities.

The presentation should feel confident and professional, not desperate.

Possible locations:

Hero
Navbar
Home CTA
Footer

Use one or two locations, not all of them.

7. Improve Home CTA

Near the bottom of the home page:

Let's Connect

Short copy indicating Austin is open to opportunities.

Buttons:

Contact Me
LinkedIn
Download Resume
PHASE 1 — Experience Page
8. Upgrade /experience

The experience page should become a major selling point.

Each position should function like a mini case study rather than a simple resume entry.

SPARQ

Display:

Senior Software Engineer Consultant

April 2023 – 2026

Include:

Overview

Short professional description of the role and environment.

Impact

Use large metric cards where supported.

Example:

$30M+

Business impact

Responsibilities

Examples:

Enterprise application development
Software architecture
.NET / C#
Angular
SQL Server
Azure
REST APIs
CI/CD
Legacy modernization
Technologies

Use compact technology tags.

Example:

C# .NET Angular SQL Server Azure REST APIs CI/CD

9. Add Selected Client Experience

If contractual/confidentiality obligations permit listing client names, make selected client work visible.

Potential clients previously identified:

UPS
TruStage

Do not expose confidential information.

For each client, where permitted, show:

Client
Role/context
Problem/domain
What Austin worked on
Technologies
Results

This should make the consulting experience feel substantial rather than hidden inside a generic employer entry.

10. Upgrade 365 LABS

Use the same case-study format:

Company
Role
Dates
Overview
Responsibilities
Major accomplishments
Technologies
Results

Maintain consistency between employment entries.

11. Add Career Timeline

Add a visual career timeline if it improves the page.

Conceptually:

2019
→ 365 LABS
→ Senior Software Development Engineer

2023
→ SPARQ
→ Senior Software Engineer Consultant

2026
→ Open to Opportunities

Keep the timeline simple and accessible.

PHASE 2 — Technical Credibility
12. Upgrade /projects

Projects should answer:

What problem did this solve?
What did Austin personally build?
Why was it technically interesting or difficult?
What technologies were used?
What was the result?

Each significant project should support a reusable case-study format.

13. Project Case Study Template

Recommended structure:

Project Name

Short one-line description.

Overview

2–4 concise paragraphs.

My Role

Clearly identify what Austin personally designed/built.

Technical Challenges

Explain meaningful engineering problems.

Examples:

Legacy modernization
Complex state management
Performance
Data modeling
API design
Deployment
Security
Scalability
Architecture

Show a simple architecture diagram where useful.

Technologies

Use technology tags.

Results

Use measurable results whenever possible.

Links

Potential links:

GitHub
Live Demo
Documentation
Video
Steam

Do not show links that do not exist.

14. Add Architecture Diagrams

For the strongest projects, add simple architecture diagrams.

Example:

Angular
   ↓
ASP.NET Core API
   ↓
Service Layer
   ↓
Entity Framework
   ↓
SQL Server

Cloud example:

User
 ↓
Angular
 ↓
Azure
 ↓
.NET API
 ↓
SQL Server

Keep diagrams simple.

Do not create complicated diagrams merely for decoration.

Architecture diagrams should help an interviewer understand the system.

15. Add Technical Deep Dives

For technically interesting projects, optionally provide sections for:

Architecture
Data Model
API Design
Testing
Performance
Security
CI/CD
Technical Challenges

This gives the portfolio two levels:

Recruiter level

Quick overview and results.

Engineer/interviewer level

Technical depth.

PHASE 2 — Skills
16. Upgrade Skills Section

Do not use visual percentage meters such as:

C# ██████████ 100%

This is not useful for a senior engineer.

Use categories and experience descriptions instead.

Recommended categories:

Languages
C#
SQL
TypeScript
JavaScript
Python
Java
HTML
CSS
XAML
Frameworks
.NET
Entity Framework
Angular
React
React Native
WPF
UWP
WinUI
Windows App SDK
Cloud
Azure
Firebase
Database
SQL Server
DevOps
Azure DevOps
GitHub Actions
CI/CD
Architecture
REST APIs
Object-Oriented Programming
Full-Stack Development
Software Architecture
AI
Anthropic Claude
AI-Assisted Development
Game Development
Godot
C#

The existing Skill model can be extended rather than replaced unless the current implementation makes that impractical.

PHASE 2 — AI / Claude
17. Add AI & Modern Development Section

Position this as practical engineering experience, not AI research.

Recommended title:

AI-Assisted Development

Explain how AI is used for:

Code generation
Code review
Debugging
Refactoring
Test generation
Documentation
Architecture exploration
Developer productivity

The positioning should be:

Senior software engineer who knows how to use AI effectively in real software development.

Avoid exaggerated claims.

18. Show Actual AI Development Examples

Where possible, create small case studies:

Problem

Large unfamiliar codebase.

Approach

Used Claude to analyze architecture and identify dependencies.

Result

Reduced time required to understand and modify the system.

Use real examples rather than invented claims.

PHASE 2 — Certifications
19. Create Certifications Section

Recommended structure:

Claude Certified Developer – Foundations

Anthropic

August 2026

[View Credential]

Add additional certifications as appropriate.

Use credential links when available.

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

25. Improve CI/CD

Current state:

Firebase Hosting automatically deploys
Cloud Functions deployed manually

Future desired pipeline:

Pull Request
    ↓
Tests
    ↓
Build
    ↓
Firebase Preview Deployment

Merge to master
    ↓
Tests
    ↓
Build
    ↓
Firebase Hosting Deployment
    ↓
Cloud Functions Deployment

Before implementing automatic Function deployment:

Confirm secrets are configured correctly.
Confirm production function deployment is safe.
Ensure failures stop the deployment.
Do not deploy Functions from pull-request preview workflows unless intentionally designed.
26. Accessibility

Audit the entire application.

Check:

Semantic HTML
Keyboard navigation
Focus states
Heading hierarchy
Alt text
Form labels
Screen reader compatibility
Color contrast
Reduced-motion preference

Do not sacrifice accessibility for visual effects.

27. Responsive Design

Test at minimum:

320px
375px
390px
768px
1024px
1440px+

Critical pages:

Home
Experience
Projects
Resume
Contact

Mobile should not feel like an afterthought.

28. Performance

Evaluate:

Bundle size
Image optimization
Lazy loading
Route-level loading
Font loading
Large media
Animation performance
Lighthouse scores

Use lazy loading for large project/game content where appropriate.

Do not add unnecessary third-party dependencies.

29. Subtle Animation

Use animation sparingly.

Good uses:

Page transitions
Cards entering viewport
Timeline transitions
Small hover effects
Hero elements

Avoid:

Particle backgrounds
Excessive motion
Spinning technology logos
Giant animated text
Constant motion
Unnecessary loading screens

Respect prefers-reduced-motion.

PHASE 3 — Navigation
30. Recommended Main Navigation

Use:

Home
Experience
Projects
Indie
Resume
Contact

Secondary links:

GitHub
LinkedIn

Do not overload the main navbar.

Put lower-priority pages such as "About This Site" in the footer.

PHASE 3 — GitHub
31. Add GitHub Presence

Add a clear GitHub link.

Potential section:

Open Source & Personal Development

Explore my code, experiments, and personal software projects on GitHub.

Button:

View GitHub →

Do not automatically import every GitHub repository unless there is a compelling reason.

Curated projects are better for a professional portfolio.

PHASE 3 — Resume
32. Make Resume Access Obvious

Provide:

View Resume
Download PDF

Potential locations:

Navbar
Home hero
Experience page
Footer

Do not force recruiters to hunt for the resume.

PHASE 3 — Contact
33. Keep Contact Simple

Recommended page:

Contact Austin

I'm currently open to opportunities in senior software engineering, .NET, full-stack, cloud, and AI-assisted development.

Fields:

Name
Email
Message

Button:

Send Message

Secondary option:

Connect with me on LinkedIn →

Do not make the recruiter complete a complicated form.

Maintain Cloudflare Turnstile protection.

PHASE 4 — SEO
34. Metadata

Recommended title:

Austin Robichaux | Senior Software Engineer

Recommended description:

Senior Software Engineer specializing in C#, .NET, Angular, SQL Server, Azure, and AI-assisted development.

Add:

Canonical URL
OpenGraph metadata
Social preview metadata
Favicon
Sitemap
robots.txt
Structured data
35. Structured Data

Add appropriate Person structured data.

Potential properties:

Name
Job title
URL
LinkedIn
GitHub
Relevant professional skills

Do not expose private information.

PHASE 4 — Analytics
36. Add Basic Analytics

Track useful portfolio actions:

Homepage visit
Resume view
Resume download
Experience page
Project page
GitHub click
LinkedIn click
Contact form submission

The goal is to answer:

Are recruiters finding and using my resume and projects?

Do not build an unnecessarily complicated analytics system.

Follow applicable privacy requirements.

PHASE 4 — Metrics
37. Add Professional Numbers Section

Potential home-page metrics:

6+

Years Software Engineering

$30M+

Business Impact

Multiple

Production Applications

4

Claude Certifications

Only use values that are current and defensible.

Do not invent metrics.

PHASE 4 — Differentiation
38. Add "What Makes Me Different?"

Possible content:

Enterprise Engineering

Real-world experience building and modernizing enterprise applications.

Product Development

Experience building software independently from idea through implementation and release.

AI-Native Development

Claude certification and practical AI-assisted software development.

Cross-Stack Experience

Backend, frontend, database, cloud, CI/CD, and desktop development.

The goal is to differentiate Austin from a generic .NET developer profile.

PHASE 4 — Recruiter View
39. Optional Recruiter Mode

Consider adding a concise page or view called:

Recruiter View

Purpose:

Give a recruiter everything necessary to evaluate Austin in approximately two minutes.

Include only:

Professional summary
Core technologies
Experience
Major accomplishments
Resume
Contact

This is optional and should only be implemented if it improves the user experience.

Do not duplicate the entire site unnecessarily.

PHASE 4 — Technical Deep Dive
40. Optional Technical Deep-Dive Pages

For strong projects, allow engineers/interviewers to explore:

Architecture
Data model
API design
Testing
Performance
Security
CI/CD
Technical challenges

This should remain secondary to the recruiter-facing experience.

Recommended Site Structure
/
├── Home
│   ├── Hero
│   ├── Professional Summary
│   ├── Key Metrics
│   ├── What I Do
│   ├── Featured Projects
│   ├── Skills
│   ├── Certifications
│   └── CTA
│
├── Experience
│   ├── SPARQ
│   │   ├── Overview
│   │   ├── Client Experience
│   │   ├── Responsibilities
│   │   ├── Technologies
│   │   └── Impact
│   └── 365 LABS
│
├── Projects
│   ├── Featured
│   ├── Professional
│   ├── Personal
│   └── Technical Deep Dives
│
├── Indie
│   ├── Hexing
│   └── Other Games
│
├── Resume
│
├── Contact
│
└── Footer
    ├── LinkedIn
    ├── GitHub
    ├── Resume
    ├── About This Site
    └── Contact
Recommended Component Architecture

Do not blindly implement every component below. Reuse existing components where they already provide the required behavior.

Potential shared components:

Hero
SectionHeader
MetricCard
CapabilityCard
ProjectCard
ProjectGrid
SkillGroup
SkillTag
CertificationCard
ExperienceTimeline
ExperienceCard
TechnologyTags
CaseStudy
ArchitectureDiagram
CTASection
SocialLinks
Footer
ContactForm

Keep components focused and reusable.

Avoid creating components for trivial one-off markup unless they provide meaningful reuse or improve maintainability.

Recommended Data Models

Existing static data architecture should remain.

Potential models:

interface Skill {
    id: string;
    name: string;
    category: string;
    level: string;
}

Potential project fields:

interface Project {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    category: string;
    technologies: string[];
    featured: boolean;
    githubUrl?: string;
    liveUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
}

Potential experience fields:

interface Experience {
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    location?: string;
    summary: string;
    responsibilities: string[];
    technologies: string[];
    achievements: string[];
    clients?: ClientExperience[];
}

Potential certification fields:

interface Certification {
    id: string;
    name: string;
    issuer: string;
    date: string;
    credentialUrl?: string;
}

Only add fields that are actually needed by the UI.

Skills Data

Current/target skills should include the following, ordered by professional relevance:

Languages
C#
SQL
TypeScript
JavaScript
Python
Java
HTML
CSS
XAML
Frameworks
.NET
Entity Framework
Angular
React
React Native
WPF
UWP
WinUI
Windows App SDK
Cloud
Azure
Firebase
Database
SQL Server
DevOps
Azure DevOps
GitHub Actions
CI/CD
Architecture
REST APIs
Object-Oriented Programming
Full-Stack Development
Software Architecture
AI
Anthropic Claude
AI-Assisted Development
Game Development
Godot
C#

Avoid presenting skill levels as fake numeric percentages.

Visual Design Guidelines
General

Use a modern professional visual system.

Prioritize:

Strong typography
Consistent spacing
Clear hierarchy
Limited color palette
Consistent cards
Consistent borders/radii
Professional hover states
Responsive layouts
Cards

Cards should support hierarchy, not exist everywhere simply for decoration.

Technology Tags

Use small, consistent pills/tags.

Example:

C# Angular Azure

Typography

Ensure:

Clear H1
Logical H2/H3 hierarchy
Comfortable paragraph width
Strong contrast
Good mobile scaling
Dark Mode

If dark mode already exists or is easy to support cleanly, maintain it.

Do not sacrifice accessibility for aesthetic effects.

Content Guidelines

The website should be written in a confident, factual style.

Prefer:

Designed and developed enterprise applications using C# and .NET.

Over:

I am passionate about creating amazing software solutions.

Prefer:

Led a redesign that contributed to $30M in business impact.

Over:

Helped make a really successful application.

Use measurable results whenever possible.

Never invent:

Revenue
User counts
Performance numbers
Client responsibilities
Technologies
Certifications
Business results

When information is unknown, leave a clear placeholder or omit the claim.

Portfolio as an Interview Asset

The portfolio itself should be a technical talking point.

Austin should be able to explain:

The site is built with Angular 22 and TypeScript, hosted on Firebase, uses Firebase Cloud Functions for the contact service, Cloudflare Turnstile for bot protection, Resend for transactional email, and GitHub Actions for deployment.

Potential interviewer questions the portfolio should support:

Why Angular?
Why Firebase?
How is the contact function secured?
How are secrets stored?
How does CI/CD work?
How are deployments handled?
How are tests executed?
Why use static TypeScript data instead of an API?
How is accessibility handled?
How is performance handled?
How would the architecture scale?
How would you monitor production?

The site should demonstrate the answers through implementation rather than merely claiming expertise.

Implementation Priority
Phase 1 — Must Have
Home page redesign
Strong hero
Professional positioning
Open-to-opportunities status
Key metrics
What I Do
Featured projects
Improved Experience page
Resume CTAs
Improved Contact page
LinkedIn/GitHub links
Phase 2 — High Value
Project case studies
Architecture diagrams
Improved Skills section
Certifications
AI/Claude section
Hexing case study
Wordle solver case study
How This Site Works
Career timeline
Phase 3 — Engineering Quality
Automated tests
CI/CD improvements
Accessibility audit
Responsive/mobile improvements
Performance optimization
SEO
Structured data
Analytics
Phase 4 — Optional Differentiators
Recruiter View
Project filtering
Technical deep dives
GitHub integration
Interactive architecture diagrams
What NOT to Build Yet

Do not spend significant time on:

Blog
CMS
Admin dashboard
Database-backed portfolio content
Automatic GitHub repository importing
Complex analytics dashboard
User accounts
Comments
Newsletter
Excessive animations
Complex particle effects
Generic developer widgets

Only add these if there is a demonstrated reason.

Definition of Done

The portfolio should ultimately satisfy these criteria.

Recruiter

A recruiter can determine within 30 seconds:

Austin is a Senior Software Engineer.
He specializes in .NET/C#/Angular/SQL/Azure.
He has meaningful enterprise experience.
He has measurable business impact.
He is open to opportunities.
His resume is one click away.
His LinkedIn/GitHub/contact information is easy to find.
Hiring Manager

A hiring manager can quickly find:

Experience
Responsibilities
Technologies
Business impact
Client experience where permissible
Projects
Technical depth
Certifications
Engineer/Interviewer

An engineer can investigate:

Architecture
Technical decisions
Testing
CI/CD
Security
AI-assisted development
Project implementation details
Technical Quality

The site itself demonstrates:

Angular
TypeScript
Responsive frontend development
Firebase
Cloud Functions
Secure secrets
Bot protection
Transactional email
CI/CD
Testing
Accessibility
Performance awareness
Professional Quality

The site should feel:

Senior
Clean
Credible
Fast
Professional
Easy to navigate
Easy to maintain
Final Guiding Principle

The portfolio should not simply say:

"I know these technologies."

It should demonstrate:

"Here is what I have built, here is the business impact I have delivered, here is how I approach engineering problems, and here is the technology I used to do it."

The best version of this site will function simultaneously as:

A recruiter landing page.
A professional resume.
A technical portfolio.
A collection of engineering case studies.
A demonstration of modern Angular/Firebase/CI/CD practices.
An interview discussion artifact.

Prioritize the first three before expanding into the others.
