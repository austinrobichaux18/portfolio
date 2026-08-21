import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Project } from '../../core/models/Project';
import { projects } from '../../core/data/projects';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit {

    project!: Project;

    constructor(private route: ActivatedRoute, private router: Router) {}

    ngOnInit(): void {

        const id = this.route.snapshot.paramMap.get('id');

        const found = projects.find(project => project.id === id);

        if (!found) {

            this.router.navigate(['/projects']);

            return;

        }

        this.project = found;

    }

}
