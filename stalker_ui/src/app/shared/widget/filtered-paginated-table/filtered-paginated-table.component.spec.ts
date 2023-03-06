import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DefaultModule } from '../../../layouts/default/default.module';
import { FilteredPaginatedTableComponent } from './filtered-paginated-table.component';

describe('FilteredPagedTableComponent', () => {
  let component: FilteredPaginatedTableComponent<number>;
  let fixture: ComponentFixture<FilteredPaginatedTableComponent<number>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultModule, NoopAnimationsModule],
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
