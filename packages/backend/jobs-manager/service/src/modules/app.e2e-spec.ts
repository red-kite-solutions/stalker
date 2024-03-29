import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should get the root of the application to check if it is alive (GET /)', async () => {
    const r = await request(app.getHttpServer()).get('/');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.text.length).toBeGreaterThan(0);
  });

  it('Should be unauthorized to get the ping route while unauthenticated (GET /ping)', async () => {
    const r = await request(app.getHttpServer()).get('/ping');
    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  afterAll(async () => {
    await app.close();
  });
});
