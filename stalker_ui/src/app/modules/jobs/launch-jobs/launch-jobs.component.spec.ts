import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchJobsComponent } from './launch-jobs.component';

describe('LaunchJobsComponent', () => {
  let component: LaunchJobsComponent;
  let fixture: ComponentFixture<LaunchJobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaunchJobsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaunchJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
