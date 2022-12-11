import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListHostsComponent } from './list-hosts.component';

describe('ListDomainsComponent', () => {
  let component: ListHostsComponent;
  let fixture: ComponentFixture<ListHostsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListHostsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListHostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
