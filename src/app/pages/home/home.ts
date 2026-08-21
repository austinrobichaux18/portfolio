import { Component } from '@angular/core';
import { ProjectCard } from '../../shared/project-card/project-card';
import { projects } from '../../core/data/projects';
import { skills } from '../../core/data/skills';
import { RouterLink } from '@angular/router';
import { RevealOnScroll } from '../../shared/reveal-on-scroll/reveal-on-scroll';
import { SkillChip } from '../../shared/skill-chip/skill-chip';
import { StatCard } from '../../shared/stat-card/stat-card';

@Component({
  selector: 'app-home',
imports: [
    RouterLink,
    StatCard,
    SkillChip,
    ProjectCard,
    RevealOnScroll
],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

    featuredProjects = projects.filter(project => project.featured);

    skillCategories = [...new Set(skills.map(skill => skill.category))].map(category => ({
        category,
        skills: skills.filter(skill => skill.category === category)
    }));

}
