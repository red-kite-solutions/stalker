import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';

import { ViewHostComponent } from './view-host.component';

describe('ViewHostComponent', () => {
  let component: ViewHostComponent;
  let fixture: ComponentFixture<ViewHostComponent>;

  beforeEach(async () => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ViewHostComponent],
      providers: [{ provide: HttpClient, useValue: httpMock.object }],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
