import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';

import { ViewDomainComponent } from './view-domain.component';

describe('ViewDomainComponent', () => {
  let component: ViewDomainComponent;
  let fixture: ComponentFixture<ViewDomainComponent>;

  beforeEach(async () => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ViewDomainComponent],
      providers: [{ provide: HttpClient, useValue: httpMock.object }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewDomainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
