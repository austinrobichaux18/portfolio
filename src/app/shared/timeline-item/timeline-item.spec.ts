import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineItem } from './timeline-item';
import { Experience } from '../../core/models/Experience';

const mockItem: Experience = {
  id: 'mock-role',
  role: 'Software Engineer',
  company: 'Mock Co',
  startDate: 'January 2020',
  endDate: 'Present',
  description: 'A role used for testing.',
};

describe('TimelineItem', () => {
  let component: TimelineItem;
  let fixture: ComponentFixture<TimelineItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineItem],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineItem);
    component = fixture.componentInstance;
    component.item = mockItem;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the role and company', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(mockItem.role);
    expect(text).toContain(mockItem.company);
  });
});
