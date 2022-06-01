import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDomainsComponent } from './list-domains.component';

describe('ListDomainsComponent', () => {
  let component: ListDomainsComponent;
  let fixture: ComponentFixture<ListDomainsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListDomainsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListDomainsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
