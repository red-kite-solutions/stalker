import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilteredPagedTableComponent } from './filtered-paged-table.component';

describe('FilteredPagedTableComponent', () => {
  let component: FilteredPagedTableComponent;
  let fixture: ComponentFixture<FilteredPagedTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilteredPagedTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilteredPagedTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
