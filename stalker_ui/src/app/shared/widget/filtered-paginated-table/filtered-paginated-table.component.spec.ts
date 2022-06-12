import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilteredPaginatedTableComponent } from './filtered-paginated-table.component';

describe('FilteredPagedTableComponent', () => {
  let component: FilteredPaginatedTableComponent;
  let fixture: ComponentFixture<FilteredPaginatedTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilteredPaginatedTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilteredPaginatedTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
