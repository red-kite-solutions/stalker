import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomJobsComponent } from './custom-jobs.component';

describe('CustomJobsComponent', () => {
  let component: CustomJobsComponent;
  let fixture: ComponentFixture<CustomJobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomJobsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
