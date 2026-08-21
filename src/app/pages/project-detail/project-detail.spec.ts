import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { ProjectDetail } from './project-detail';
import { projects } from '../../core/data/projects';

function setup(id: string | null) {
  const navigate = vi.fn();

  TestBed.configureTestingModule({
    imports: [ProjectDetail],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
      },
      { provide: Router, useValue: { navigate } },
    ],
  });

  const fixture: ComponentFixture<ProjectDetail> = TestBed.createComponent(ProjectDetail);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, navigate };
}

describe('ProjectDetail', () => {

  it('loads the matching project for a valid id', () => {
    const knownProject = projects[0];
    const { component, navigate } = setup(knownProject.id);

    expect(component.project).toEqual(knownProject);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirects to /projects when the id does not match a project', () => {
    const { navigate } = setup('not-a-real-project');

    expect(navigate).toHaveBeenCalledWith(['/projects']);
  });

});
