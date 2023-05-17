import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { getName } from '../../../../test/test.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';
import { User, UserDocument } from './users.model';
import { UsersService } from './users.service';

describe('Users Service', () => {
  let moduleFixture: TestingModule;
  let userService: UsersService;
  let userModel: Model<User>;
  const prefix = 'user-service';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    userService = moduleFixture.get(UsersService);
    userModel = moduleFixture.get<Model<User>>(getModelToken('users'));
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Create users', () => {
    it('Should create a user', async () => {
      // Arrange
      const email = `${getName(prefix)}@stalker.is`;

      // Act
      const u1 = await user({ role: Role.Admin, email: email });

      // Assert
      expect(u1.email).toStrictEqual(email);
    });
  });

  describe('Delete users', () => {
    it('Should delete an admin', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user();

      // Act
      const del = await userService.deleteUserById(u1._id.toString());

      // Assert
      expect(del.deletedCount).toStrictEqual(1);
    });

    it('Should delete a user', async () => {
      // Arrange
      const u1 = await user({ role: Role.User });

      // Act
      const del = await userService.deleteUserById(u1._id.toString());

      // Assert
      expect(del.deletedCount).toStrictEqual(1);
    });

    it('Should not delete the last admin', async () => {
      // Arrange
      const u1 = await user();
      expect.assertions(1);

      // Act
      try {
        await userService.deleteUserById(u1._id.toString());
      } catch (err) {
        // Assert
        expect(err.status).toStrictEqual(400);
      }
    });

    it('Should not delete the last active admin', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user({ active: false });
      expect.assertions(1);

      // Act
      try {
        await userService.deleteUserById(u1._id.toString());
      } catch (err) {
        // Assert
        expect(err.status).toStrictEqual(400);
      }
    });

    it('Should delete an inactive admin', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user({ active: false });

      // Act
      const del = await userService.deleteUserById(u2._id.toString());

      // Assert
      expect(del.deletedCount).toStrictEqual(1);
    });
  });

  describe('Edit users', () => {
    it('Should edit a user', async () => {
      // Arrange
      const newEmail = `${getName(prefix)}@stalker.is}`;
      const u1 = await user();

      // Act
      await userService.editUserById(u1._id, { email: newEmail });

      // Assert
      const u1Ng = await userService.findOneById(u1._id.toString());
      expect(u1Ng.email).toStrictEqual(newEmail);
    });

    it('Should demote a user', async () => {
      // Arrange
      const u1 = await user({ role: Role.User });

      // Act
      await userService.editUserById(u1._id.toString(), {
        role: Role.ReadOnly,
      });

      // Assert
      const u1Ng = await userService.findOneById(u1._id.toString());
      expect(u1Ng.role).toStrictEqual(Role.ReadOnly);
    });

    it('Should demote an admin', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user();

      // Act
      await userService.editUserById(u1._id.toString(), { role: Role.User });

      // Assert
      const u1Ng = await userService.findOneById(u1._id.toString());
      expect(u1Ng.role).toStrictEqual(Role.User);
    });

    it('Should not demote the last admin', async () => {
      // Arrange
      const u1 = await user();
      expect.assertions(1);

      // Act
      try {
        await userService.editUserById(u1._id.toString(), { role: Role.User });
      } catch (err) {
        // Assert
        expect(err.status).toStrictEqual(400);
      }
    });

    it('Should not demote the last active admin', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user({ active: false });
      expect.assertions(1);

      // Act
      try {
        await userService.editUserById(u1._id.toString(), { role: Role.User });
      } catch (err) {
        // Assert
        expect(err.status).toStrictEqual(400);
      }
    });

    it('Should demote an inactive user', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user({ active: false });

      // Act
      await userService.editUserById(u2._id.toString(), {
        role: Role.ReadOnly,
      });

      // Assert
      const u2Ng = await userService.findOneById(u2._id.toString());
      expect(u2Ng.role).toStrictEqual(Role.ReadOnly);
    });

    it('Should deactivate a user', async () => {
      // Arrange
      const u1 = await user({ role: Role.User });

      // Act
      await userService.editUserById(u1._id.toString(), { active: false });

      // Assert
      const u1Ng = await userService.findOneById(u1._id.toString());
      expect(u1Ng.active).toStrictEqual(false);
    });

    it('Should deactivate an admin', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user();

      // Act
      await userService.editUserById(u1._id.toString(), { active: false });

      // Assert
      const u1Ng = await userService.findOneById(u1._id.toString());
      expect(u1Ng.active).toStrictEqual(false);
    });

    it('Should not deactivate the last admin', async () => {
      // Arrange
      const u1 = await user();
      expect.assertions(1);

      // Act
      try {
        await userService.editUserById(u1._id.toString(), { active: false });
      } catch (err) {
        // Assert
        expect(err.status).toStrictEqual(400);
      }
    });

    it('Should not deactivate the last active admin', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user({ active: false });
      expect.assertions(1);

      // Act
      try {
        await userService.editUserById(u1._id.toString(), { active: false });
      } catch (err) {
        // Assert
        expect(err.status).toStrictEqual(400);
      }
    });

    it('Should deactivate an inactive user', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user({ active: false });

      // Act
      await userService.editUserById(u2._id.toString(), { active: false });

      // Assert
      const u2Ng = await userService.findOneById(u2._id.toString());
      expect(u2Ng.active).toStrictEqual(false);
    });
  });

  /**
   *
   * @param u Creates an admin filled with random values
   * @returns
   */
  async function user(u: Partial<User> = {}): Promise<UserDocument> {
    if (!u.email) u.email = `${getName(prefix)}@stalker.is`;
    if (!u.role) u.role = Role.Admin;
    if (!u.firstName) u.firstName = getName(prefix);
    if (!u.lastName) u.lastName = getName(prefix);
    if (!u.password) u.password = getName(prefix);
    if (typeof u.active === 'undefined') u.active = true;

    return await userService.createUser({
      ...u,
    });
  }
});
