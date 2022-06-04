import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PillTagComponent } from './pill-tag.component';

describe('PillTagComponent', () => {
  let component: PillTagComponent;
  let fixture: ComponentFixture<PillTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PillTagComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PillTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
