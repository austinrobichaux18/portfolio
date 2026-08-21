import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../core/models/Project';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss'
})
export class ProjectCard {

    @Input() project!: Project;

    get isExternalLink(): boolean {
        return !!this.project.link && /^https?:\/\//.test(this.project.link);
    }

}
