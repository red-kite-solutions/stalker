import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  checkAuthorizations,
  getReq,
  initTesting,
  putReq,
  TestingData,
} from 'test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';
import { DEFAULT_CONFIG } from './config.default';

describe('Config Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const conf = DEFAULT_CONFIG;
  const defaultConfigSubmit = {
    isNewContentReported: conf.isNewContentReported,
    keybaseConfigEnabled: conf.keybaseConfig.enabled,
    keybaseConfigUsername: conf.keybaseConfig.username,
    keybaseConfigPaperkey: conf.keybaseConfig.paperkey,
    keybaseConfigChannelId: conf.keybaseConfig.channelId,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should successfully get the default config (GET /admin/config)', async () => {
    const r = await getReq(app, testData.admin.token, '/admin/config');

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.isNewContentReported).toBe(conf.isNewContentReported);
    expect(r.body.keybaseConfig).toBeTruthy();
    expect(r.body.keybaseConfig.enabled).toBe(conf.keybaseConfig.enabled);
    expect(r.body.keybaseConfig.username).toBe(conf.keybaseConfig.username);
    expect(r.body.keybaseConfig.paperkey).toBe(conf.keybaseConfig.paperkey);
    expect(r.body.keybaseConfig.channelId).toBe(conf.keybaseConfig.channelId);
  });

  it('Should change the configuration to new values (PUT /admin/config)', async () => {
    const newConfig = {
      isNewContentReported: true,
      keybaseConfig: {
        enabled: true,
        username: 'stalker_bot',
        paperkey: 'thisismykey',
        channelId: 'thisismychannelid',
      },
    };
    let r = await putReq(app, testData.admin.token, '/admin/config', {
      isNewContentReported: newConfig.isNewContentReported,
      keybaseConfigEnabled: newConfig.keybaseConfig.enabled,
      keybaseConfigUsername: newConfig.keybaseConfig.username,
      keybaseConfigPaperkey: newConfig.keybaseConfig.paperkey,
      keybaseConfigChannelId: newConfig.keybaseConfig.channelId,
    });

    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.admin.token, '/admin/config');

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.isNewContentReported).toBe(newConfig.isNewContentReported);
    expect(r.body.keybaseConfig).toBeTruthy();
    expect(r.body.keybaseConfig.enabled).toBe(newConfig.keybaseConfig.enabled);
    expect(r.body.keybaseConfig.username).toBe(
      newConfig.keybaseConfig.username,
    );
    expect(r.body.keybaseConfig.paperkey).toBe('********');
    expect(r.body.keybaseConfig.channelId).toBe(
      newConfig.keybaseConfig.channelId,
    );

    r = await putReq(
      app,
      testData.admin.token,
      '/admin/config',
      defaultConfigSubmit,
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should have proper authorizations (GET /admin/config)', async () => {
    const result: boolean = await checkAuthorizations(
      testData,
      Role.Admin,
      async (givenToken: string) => {
        return await getReq(app, givenToken, '/admin/config');
      },
    );
    expect(result).toBe(true);
  });

  it('Should have proper authorizations (PUT /admin/config)', async () => {
    const result: boolean = await checkAuthorizations(
      testData,
      Role.Admin,
      async (givenToken: string) => {
        return await putReq(
          app,
          givenToken,
          '/admin/config',
          defaultConfigSubmit,
        );
      },
    );
    expect(result).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
