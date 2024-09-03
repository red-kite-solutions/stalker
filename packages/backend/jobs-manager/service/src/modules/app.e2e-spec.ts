import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
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

  it('Should be unauthorized get the root of the application (GET /)', async () => {
    const r = await request(app.getHttpServer()).get('/');
    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should the ping route while (GET /ping)', async () => {
    const r = await request(app.getHttpServer()).get('/ping');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.text.length).toBeGreaterThan(0);
  });
});
