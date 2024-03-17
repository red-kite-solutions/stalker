import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { ProjectService } from '../reporting/project.service';
import { Secret } from './secrets.model';
import { SecretsService, secretPrefix } from './secrets.service';

describe('SecretsService', () => {
  let secretsService: SecretsService;
  let secretsModel: Model<Secret>;
  let projectsService: ProjectService;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    secretsService = moduleFixture.get(SecretsService);
    projectsService = moduleFixture.get(ProjectService);
    secretsModel = moduleFixture.get<Model<Secret>>(getModelToken('secret'));
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  beforeEach(async () => {
    const secrets = await secretsService.getAll();
    for (const s of secrets) {
      await secretsService.delete(s._id.toString());
    }
    const projects = await projectsService.getAllIds();
    for (const p of projects) {
      await projectsService.delete(p);
    }
  });

  const testingValueToEncrypt = 'example secret string';

  it('Should encrypt a secret', () => {
    // Arrange & Act
    const encrypted = SecretsService.encrypt(testingValueToEncrypt);
    // Assert
    expect(encrypted).toBeTruthy();
    expect(encrypted.slice(0, secretPrefix.length)).toStrictEqual(secretPrefix);
  });

  it('Should give two different encrypted values for the same input value', () => {
    // Arrange & Act
    const e1 = SecretsService.encrypt(testingValueToEncrypt);
    const e2 = SecretsService.encrypt(testingValueToEncrypt);
    // Assert
    expect(e1).not.toEqual(e2);
  });

  it('Should create a secret and not return its value', async () => {
    // Arrange
    const name = 'test name';

    // Act
    const s = await secret(name);

    // Assert
    expect(s.name).toStrictEqual(name);
    // @ts-expect-error
    expect(s.value).toBeUndefined();
  });

  it('Should attempt to create two secrets and fail (duplicate, no project)', async () => {
    // Arrange
    const name = 'test name';

    // Act
    const s = await secret(name);
    let code = -1;

    // Assert
    try {
      await secret(name);
    } catch (err) {
      code = err.code;
    }

    expect(code).toStrictEqual(MONGO_DUPLICATE_ERROR);
  });

  it('Should attempt to create two secrets and fail (duplicate in same project)', async () => {
    // Arrange
    const name = 'test name';
    const p = await project('pname');

    // Act
    const s = await secret(name, p._id.toString());
    let code = -1;

    // Assert
    try {
      await secret(name, p._id.toString());
    } catch (err) {
      code = err.code;
    }

    expect(code).toStrictEqual(MONGO_DUPLICATE_ERROR);
  });

  it('Should create two secrets (same name, different project)', async () => {
    // Arrange
    const name = 'test name';
    const p = await project('pname');
    const p2 = await project('pname2');

    // Act
    const s = await secret(name, p._id.toString());
    let code = -1;

    // Assert
    try {
      await secret(name, p2._id.toString());
      await secret(name);
    } catch (err) {
      code = err.code;
    }

    expect(code).toStrictEqual(-1);
  });

  it('Should get a secret without its value', async () => {
    // Arrange
    const name = 'test name';
    const s = await secret(name);

    // Act
    const s1 = await secretsService.get(s._id.toString());

    // Assert
    expect(s1.name).toStrictEqual(s.name);
    expect(s1.value).toBeUndefined();
  });

  it('Should get all secrets without their value', async () => {
    // Arrange
    const name = 'test name';
    const s00 = await secret(name);
    const s01 = await secret('new name');
    const s02 = await secret('new name2');

    // Act
    const secrets = await secretsService.getAll();

    // Assert
    expect(secrets.length).toStrictEqual(3);
    for (const s of secrets) {
      expect(s.value).toBeUndefined();
    }
  });

  it('Should get the best secret for a project (no project secret)', async () => {
    // Arrange
    const name = 'test name';
    await secret(name);
    await secret('new name');
    await secret('new name2');

    // Act
    const s = await secretsService.getBestSecretWithValue(name);

    // Assert
    expect(s.name).toStrictEqual(name);
    expect(s.value).toBeDefined();
  });

  it('Should get the best secret for a project (project secret)', async () => {
    // Arrange
    const name = 'test name';
    const sValue = 'new secret value';
    const p1 = await project('project name 1');
    const p2 = await project('project name 2');
    await secret(name);
    await secret('new name', p2._id.toString());
    const s3 = await secret(name, p1._id.toString(), sValue);

    // Act
    const s = await secretsService.getBestSecretWithValue(name);

    // Assert
    const s3Value = (await secretsModel.findById(s3._id, '+value')).value;
    expect(s.name).toStrictEqual(s3.name);
    expect(s.projectId.toString()).toStrictEqual(s3.projectId.toString());
    expect(s.value).toStrictEqual(s3Value);
  });

  it('Should get the best secret for a project (no secret matching)', async () => {
    // Arrange
    const name = 'test name';
    const sValue = 'new secret value';
    const p1 = await project('project name 1');
    const p2 = await project('project name 2');
    await secret(name);
    await secret('new name', p2._id.toString());
    const s3 = await secret(name, p1._id.toString(), sValue);

    // Act
    const s = await secretsService.getBestSecretWithValue(name + 'notmatching');

    // Assert
    expect(s).toBeUndefined();
  });

  async function secret(
    name: string,
    projectId: string = undefined,
    value = undefined,
  ) {
    if (!value) value = testingValueToEncrypt;
    return await secretsService.create(name, value, projectId);
  }

  async function project(name: string) {
    return await projectsService.addProject({
      name: name,
    });
  }
});
