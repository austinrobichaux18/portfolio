import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProjectCard } from './project-card';
import { Project } from '../../core/models/Project';

const mockProject: Project = {
  id: 'mock-project',
  title: 'Mock Project',
  description: 'A project used for testing.',
  tags: ['C#', '.NET'],
  link: '/projects/mock-project',
};

describe('ProjectCard', () => {
  let component: ProjectCard;
  let fixture: ComponentFixture<ProjectCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCard);
    component = fixture.componentInstance;
    component.project = mockProject;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('treats an internal link as not external', () => {
    expect(component.isExternalLink).toBe(false);
  });

  it('treats an http(s) link as external', () => {
    component.project = { ...mockProject, link: 'https://github.com/austinrobichaux18/example' };
    expect(component.isExternalLink).toBe(true);
  });
});
