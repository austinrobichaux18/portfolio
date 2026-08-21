
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
