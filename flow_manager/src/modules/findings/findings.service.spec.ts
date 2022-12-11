import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { FindingsService } from './findings.service';

describe('Findings Service Spec', () => {
  let moduleFixture: TestingModule;
  let findingsService: FindingsService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    findingsService = moduleFixture.get(FindingsService);
  });

  beforeEach(async () => {});

  it('Test', () => {
    expect('lel').toEqual(2);
  });
});
