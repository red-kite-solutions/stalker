import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilteredPaginatedTableComponent } from './filtered-paginated-table.component';

describe('FilteredPagedTableComponent', () => {
  let component: FilteredPaginatedTableComponent<number>;
  let fixture: ComponentFixture<FilteredPaginatedTableComponent<number>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilteredPaginatedTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilteredPaginatedTableComponent<number>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
