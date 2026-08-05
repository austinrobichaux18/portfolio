import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillChip } from './skill-chip';

describe('SkillChip', () => {
  let component: SkillChip;
  let fixture: ComponentFixture<SkillChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillChip],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillChip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
