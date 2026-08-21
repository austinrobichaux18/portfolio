import { Component } from '@angular/core';
import { ProjectCard } from '../../shared/project-card/project-card';
import { projects } from '../../core/data/projects';
import { RouterLink } from '@angular/router';
import { SkillChip } from '../../shared/skill-chip/skill-chip';
import { StatCard } from '../../shared/stat-card/stat-card';

@Component({
  selector: 'app-home',
imports: [
    RouterLink,
    StatCard,
    SkillChip,
    ProjectCard
],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

    featuredProjects = projects.filter(project => project.featured);

}
