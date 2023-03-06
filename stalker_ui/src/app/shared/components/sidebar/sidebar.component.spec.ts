import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';

import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    await TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      providers: [{ provide: HttpClient, useValue: httpMock.object }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
