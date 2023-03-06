import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';

import { ListDomainsComponent } from './list-domains.component';

describe('ListDomainsComponent', () => {
  let component: ListDomainsComponent;
  let fixture: ComponentFixture<ListDomainsComponent>;

  beforeEach(async () => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    await TestBed.configureTestingModule({
      declarations: [ListDomainsComponent],
      providers: [
        { provide: MatDialog, useValue: Mock.ofType<MatDialog>().object },
        { provide: HttpClient, useValue: httpMock.object },
        { provide: ToastrService, useValue: Mock.ofType<ToastrService>().object },
      ],
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
