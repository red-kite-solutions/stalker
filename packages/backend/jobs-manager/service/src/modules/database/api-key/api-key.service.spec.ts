import { Test, TestingModule } from '@nestjs/testing';

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';
import { User } from '../users/users.model';
import { UsersService } from '../users/users.service';
import { ApiKey } from './api-key.model';
import { ApiKeyService } from './api-key.service';

describe('Api Key Service', () => {
  let moduleFixture: TestingModule;

  let usersService: UsersService;
  let apiKeyService: ApiKeyService;
  let usersModel: Model<User>;
  let apiKeyModel: Model<ApiKey>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    usersService = moduleFixture.get(UsersService);
    apiKeyService = moduleFixture.get(ApiKeyService);
    usersModel = moduleFixture.get<Model<User>>(getModelToken('users'));
    apiKeyModel = moduleFixture.get<Model<ApiKey>>(getModelToken('apikey'));
  });

  beforeEach(async () => {
    await usersModel.deleteMany({});
    await apiKeyModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('Should create an API key for a user and return its value', async () => {
    // Arrange
    const u1 = await user('admin@red-kite.io', Role.Admin);

    // Act
    const k1 = await apiKey(u1._id.toString(), Role.Admin);

    // Assert
    expect(k1.key).toBeTruthy();
  });

  describe('Get API keys', () => {
    it('Should get an API key without its value', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);

      // Act
      const k1Value = await apiKeyService.getById(k1._id.toString());

      // Assert
      expect(k1Value._id.toString()).toStrictEqual(k1._id.toString());
      expect(k1Value.key).toBeFalsy();
    });

    it('Should get an API key for user', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u2._id.toString(), Role.Admin);

      // Act
      const k1Value = await apiKeyService.getById(
        k1._id.toString(),
        u1._id.toString(),
      );

      // Assert
      expect(k1Value._id.toString()).toStrictEqual(k1._id.toString());
      expect(k1Value.key).toBeFalsy();
    });

    it('Should not get an API key for wrong user', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u2._id.toString(), Role.Admin);

      // Act
      const k1Value = await apiKeyService.getById(
        k1._id.toString(),
        u2._id.toString(),
      );

      // Assert
      expect(k1Value).toBeFalsy();
    });

    it('Should get all API keys', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin);

      // Act
      const keys = await apiKeyService.getAll();

      // Assert
      expect(keys.length).toStrictEqual(3);
    });

    it('Should get all API keys (paging)', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin);

      // Act
      const keys = await apiKeyService.getAll(1, 1);

      // Assert
      expect(keys.length).toStrictEqual(1);
    });

    it('Should get all API keys for user', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin);

      // Act
      const keys = await apiKeyService.getAll(0, 10, {
        userId: u1._id.toString(),
      });

      // Assert
      expect(keys.length).toStrictEqual(2);
    });
  });

  describe('API keys validation', () => {
    it('Should find a valid API key', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin);

      // Act
      const key = await apiKeyService.findValidApiKey(k2.key);

      // Assert
      expect(key._id.toString()).toStrictEqual(k2._id.toString());
      expect(key.userId.toString()).toStrictEqual(k2.userId.toString());
      expect(key.role).toStrictEqual(k2.role);
    });

    it('Should not find an invalid API key', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin);

      // Act
      const key = await apiKeyService.findValidApiKey(k2.key + 'a');

      // Assert
      expect(key).toBeFalsy();
    });

    it('Should not find a valid API key for a deactivated user (admin)', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin);
      await usersService.editUserById(u1._id.toString(), { active: false });

      // Act
      const key = await apiKeyService.findValidApiKey(k2.key);

      // Assert
      expect(key).toBeFalsy();
    });

    it('Should not find a valid API key for a deactivated user (user)', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.User);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.User);
      await usersService.editUserById(u2._id.toString(), { active: false });

      // Act
      const key = await apiKeyService.findValidApiKey(k3.key);

      // Assert
      expect(key).toBeFalsy();
    });

    it('Should find a valid API key for a reactivated user (admin)', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin);
      await usersService.editUserById(u1._id.toString(), { active: false });
      await usersService.editUserById(u1._id.toString(), { active: true });

      // Act
      const key = await apiKeyService.findValidApiKey(k2.key);

      // Assert
      expect(key._id.toString()).toStrictEqual(k2._id.toString());
      expect(key.userId.toString()).toStrictEqual(k2.userId.toString());
      expect(key.role).toStrictEqual(k2.role);
    });

    it('Should find a valid API key for a reactivated user (user)', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.User);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.User);
      await usersService.editUserById(u2._id.toString(), { active: false });
      await usersService.editUserById(u2._id.toString(), { active: true });

      // Act
      const key = await apiKeyService.findValidApiKey(k3.key);

      // Assert
      expect(key._id.toString()).toStrictEqual(k3._id.toString());
      expect(key.userId.toString()).toStrictEqual(k3.userId.toString());
      expect(key.role).toStrictEqual(k3.role);
    });

    it('Should not find a valid expired API key', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.User);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.User, Date.now() - 1);

      // Act
      const key = await apiKeyService.findValidApiKey(k3.key);

      // Assert
      expect(key).toBeFalsy();
    });
  });

  describe('Delete API keys', () => {
    it('Should delete an API key', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.User);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.User, Date.now() - 1);

      // Act
      await apiKeyService.delete(k1._id.toString());

      // Assert
      const allKeys = await apiKeyService.getAll();
      expect(allKeys.length).toStrictEqual(2);
    });

    it('Should delete an API key for a user', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.User);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.User, Date.now() - 1);

      // Act
      await apiKeyService.delete(k1._id.toString(), u1._id.toString());

      // Assert
      const allKeys = await apiKeyService.getAll();
      expect(allKeys.length).toStrictEqual(2);
    });

    it('Should not delete an API key (wrong user)', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.User);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.User, Date.now() - 1);

      // Act
      await apiKeyService.delete(k1._id.toString(), u2._id.toString());

      // Assert
      const allKeys = await apiKeyService.getAll();
      expect(allKeys.length).toStrictEqual(3);
    });

    it('Should delete all keys for a user', async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.User);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.User, Date.now() - 1);

      // Act
      await apiKeyService.deleteAllForUser(u1._id.toString());

      // Assert
      const allKeys = await apiKeyService.getAll();
      expect(allKeys.length).toStrictEqual(1);
      expect(allKeys[0]._id.toString()).toStrictEqual(k3._id.toString());
    });

    it("Should delete all the user's keys when deleting the user", async () => {
      // Arrange
      const u1 = await user('admin@red-kite.io', Role.Admin);
      const u2 = await user('qwerty@red-kite.io', Role.Admin);
      const k1 = await apiKey(u1._id.toString(), Role.Admin);
      const k2 = await apiKey(u1._id.toString(), Role.Admin);
      const k3 = await apiKey(u2._id.toString(), Role.Admin, Date.now() - 1);

      // Act
      await usersService.deleteUserById(u1._id.toString());

      // Assert
      const allKeys = await apiKeyService.getAll();
      expect(allKeys.length).toStrictEqual(1);
      expect(allKeys[0]._id.toString()).toStrictEqual(k3._id.toString());
    });
  });

  async function user(email: string, role: Role, active: boolean = true) {
    return await usersService.createUser({
      email: email,
      role: role,
      active: active,
      firstName: 'asdf',
      lastName: 'qwerty',
      password: 'password',
    });
  }

  async function apiKey(
    userId: string,
    role: Role,
    expiresAt: number = Date.now() * 2,
    name: string = 'Test api key',
  ) {
    return await apiKeyService.create(name, userId, role, expiresAt);
  }
});
