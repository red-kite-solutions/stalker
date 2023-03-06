import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrService } from 'ngx-toastr';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';
import { DefaultModule } from '../../../layouts/default/default.module';

import { LaunchJobsComponent } from './launch-jobs.component';

describe('LaunchJobsComponent', () => {
  let component: LaunchJobsComponent;
  let fixture: ComponentFixture<LaunchJobsComponent>;

  beforeEach(async () => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    await TestBed.configureTestingModule({
      imports: [DefaultModule, NoopAnimationsModule],
      providers: [
        { provide: ToastrService, useValue: Mock.ofType<ToastrService>().object },
        { provide: HttpClient, useValue: httpMock.object },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LaunchJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
