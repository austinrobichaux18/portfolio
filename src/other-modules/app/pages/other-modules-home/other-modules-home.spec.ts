import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OtherModulesHome } from './other-modules-home';

describe('OtherModulesHome', () => {
  let component: OtherModulesHome;
  let fixture: ComponentFixture<OtherModulesHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherModulesHome],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(OtherModulesHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
