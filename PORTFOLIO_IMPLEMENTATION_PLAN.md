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
