import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { It, Mock } from 'typemoq';

import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    const httpMock = Mock.ofType<HttpClient>();
    httpMock.setup((x) => x.get(It.isAny())).returns(() => EMPTY);

    TestBed.configureTestingModule({ providers: [{ provide: HttpClient, useValue: httpMock.object }] });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
