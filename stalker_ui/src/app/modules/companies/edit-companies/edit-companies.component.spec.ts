import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrService } from 'ngx-toastr';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';
import { DefaultModule } from '../../../layouts/default/default.module';

import { EditCompaniesComponent } from './edit-companies.component';

describe('EditCompaniesComponent', () => {
  let component: EditCompaniesComponent;
  let fixture: ComponentFixture<EditCompaniesComponent>;

  beforeEach(async () => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    await TestBed.configureTestingModule({
      imports: [DefaultModule, RouterTestingModule, NoopAnimationsModule],
      declarations: [EditCompaniesComponent],
      providers: [
        { provide: ToastrService, useValue: Mock.ofType<ToastrService>().object },
        { provide: HttpClient, useValue: httpMock.object },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
