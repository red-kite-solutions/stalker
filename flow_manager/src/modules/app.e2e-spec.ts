import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app.module';
import request from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('Should get the root of the application to check if it is alive (GET /)', async () => {
    const r = await request(app.getHttpServer()).get('/');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.text).toBe('Hello World!!');
  });

  it('Should be unauthorized to get the ping route while unauthenticated (GET /ping)', async () => {
    const r = await request(app.getHttpServer()).get('/ping');
    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  afterAll(async () => {
    await app.close();
  });
});
