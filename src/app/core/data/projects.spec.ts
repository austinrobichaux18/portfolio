import { projects } from './projects';

describe('projects data', () => {

  it('has a non-empty id and title for every project', () => {
    for (const project of projects) {
      expect(project.id.trim().length).toBeGreaterThan(0);
      expect(project.title.trim().length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = projects.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points internal case-study links at the project\'s own id', () => {
    for (const project of projects) {
      if (project.link && !/^https?:\/\//.test(project.link)) {
        expect(project.link).toBe(`/projects/${project.id}`);
      }
    }
  });

});
