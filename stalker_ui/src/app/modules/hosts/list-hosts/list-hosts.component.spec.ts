import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';

import { ListHostsComponent } from './list-hosts.component';

describe('ListHostsComponent', () => {
  let component: ListHostsComponent;
  let fixture: ComponentFixture<ListHostsComponent>;

  beforeEach(async () => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    await TestBed.configureTestingModule({
      declarations: [ListHostsComponent],
      providers: [
        { provide: HttpClient, useValue: httpMock.object },
        { provide: ToastrService, useValue: Mock.ofType<ToastrService>().object },
        { provide: MatDialog, useValue: Mock.ofType<MatDialog>().object },
      ],
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
