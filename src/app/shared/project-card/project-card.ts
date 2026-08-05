import { Component, Input } from '@angular/core';
import { Project } from '../../core/models/Project';

@Component({
  selector: 'app-project-card',
  imports: [],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss'
})
export class ProjectCard {

    @Input() project!: Project;

}
