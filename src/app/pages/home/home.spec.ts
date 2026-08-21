import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('only shows projects flagged as featured', () => {
    expect(component.featuredProjects.length).toBeGreaterThan(0);
    expect(component.featuredProjects.every((project) => project.featured)).toBe(true);
  });

  it('groups skills by category', () => {
    expect(component.skillCategories.length).toBeGreaterThan(0);

    for (const group of component.skillCategories) {
      expect(group.skills.every((skill) => skill.category === group.category)).toBe(true);
    }
  });
});
