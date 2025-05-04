import { HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { getName } from '../../../test/test.utils';
import { AppModule } from '../../app.module';
import {
  GROUP_ADMIN_SCOPES,
  RESET_PASSWORD_SCOPE,
  Role,
} from '../../auth/constants';
import { EmailService } from '../../notifications/emails/email.service';
import { MagicLinkToken } from './magic-link-token.model';
import { CreateFirstUserDto } from './users.dto';
import { User, UserDocument } from './users.model';
import { UsersService } from './users.service';
import { GroupsService } from '../groups/groups.service';
import { Group } from '../groups/groups.model';

describe('Users Service', () => {
  let moduleFixture: TestingModule;
  let userService: UsersService;
  let userModel: Model<User>;
  let groupService: GroupsService;
  let groupModel: Model<Group>;

  let magicLinkToken: Model<MagicLinkToken>;
  let emailService: EmailService;
  const prefix = 'user-service';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    userService = moduleFixture.get(UsersService);
    userModel = moduleFixture.get<Model<User>>(getModelToken('users'));
    groupService = moduleFixture.get(GroupsService);
    groupModel = moduleFixture.get<Model<Group>>(getModelToken('groups'));
    magicLinkToken = moduleFixture.get<Model<MagicLinkToken>>(
      getModelToken('magicLinkTokens'),
    );
    emailService = moduleFixture.get(EmailService);
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await magicLinkToken.deleteMany({});
    await groupModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Create users', () => {
    it('Should validate that the first user is not created', async () => {
      // Arrange && Act
      const uc = await userService.isFirstUserCreated();

      // Assert
      expect(uc).toStrictEqual(false);
    });

    it('Should create the first user', async () => {
      // Arrange
      const u: CreateFirstUserDto = {
        email: `${getName(prefix)}@red-kite.io`,
        firstName: getName(prefix),
        lastName: getName(prefix),
        password: getName(prefix),
      };

      // Act
      await userService.createFirstUser(u);

      const uc = await userService.isFirstUserCreated();
      // Assert
      expect(uc).toStrictEqual(true);
    });

    it('Should create the first user with proper values', async () => {
      // Arrange
      const u: CreateFirstUserDto = {
        email: `${getName(prefix)}@red-kite.io`,
        firstName: getName(prefix),
        lastName: getName(prefix),
        password: getName(prefix),
      };

      // Act
      await userService.createFirstUser(u);

      // Assert
      const cu = await userModel.findOne({});
      expect(cu.email).toStrictEqual(u.email);
      expect(cu.firstName).toStrictEqual(u.firstName);
      expect(cu.lastName).toStrictEqual(u.lastName);
      expect(cu.active).toStrictEqual(true);
    });

    it('Should prevent the creation of a second first user', async () => {
      // Arrange
      expect.assertions(1);
      const u: CreateFirstUserDto = {
        email: `${getName(prefix)}@red-kite.io`,
        firstName: getName(prefix),
        lastName: getName(prefix),
        password: getName(prefix),
      };

      await userService.createFirstUser(u);

      try {
        // Act
        await userService.createFirstUser(u);
      } catch (err) {
        // Assert
        expect(err.status).toStrictEqual(HttpStatus.FORBIDDEN);
      }
    });

    it('Should create a user', async () => {
      // Arrange
      const email = `${getName(prefix)}@red-kite.io`;

      // Act
      const u1 = await user({ email: email });

      // Assert
      expect(u1.email).toStrictEqual(email);
    });

    it('Should not create a user (email conflict) (POST /users)', async () => {
      // Arrange
      const email = `${getName(prefix)}@red-kite.io`;
      const u1 = await user({ email: email });

      // Act
      const act = async () => await user({ email: email });

      // Assert
      await expect(act).rejects.toThrow();
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
      const u1 = await user();

      // Act
      const del = await userService.deleteUserById(u1._id.toString());

      // Assert
      expect(del.deletedCount).toStrictEqual(1);
    });

    it('Should not delete the last admin', async () => {
      // Arrange
      const u1 = await user();
      await groupService.create(
        'admins',
        [u1._id.toString()],
        GROUP_ADMIN_SCOPES,
      );
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
      const newEmail = `${getName(prefix)}@red-kite.io}`;
      const u1 = await user();

      // Act
      await userService.editUserById(u1._id, { email: newEmail });

      // Assert
      const u1Ng = await userService.findOneById(u1._id.toString());
      expect(u1Ng.email).toStrictEqual(newEmail);
    });

    it('Should deactivate a user', async () => {
      // Arrange
      const u1 = await user();

      // Act
      await userService.editUserById(u1._id.toString(), { active: false });

      // Assert
      const u1Ng = await userService.findOneById(u1._id.toString());
      expect(u1Ng.active).toStrictEqual(false);
    });

    it('Should not deactivate the last admin', async () => {
      // Arrange
      const u1 = await user();
      await groupService.create(
        'admins',
        [u1._id.toString()],
        GROUP_ADMIN_SCOPES,
      );
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

    it('Should not edit when email exists', async () => {
      // Arrange
      const u1 = await user();
      const u2 = await user();

      // Act
      const act = async () =>
        await userService.editUserById(u2._id.toString(), { email: u1.email });

      // Assert
      await expect(act).rejects.toThrow();
    });
  });

  describe('Magic link', () => {
    it('Should create magic link and send email', async () => {
      // Arrange
      const sendEmailSpy = jest.spyOn(emailService, 'sendResetPassword');
      const u = await user();

      // Act
      await userService.createPasswordResetRequest(u.email);
      await new Promise(process.nextTick); // Wait for all promises to finish

      // Assert
      const userMagicLinks = await magicLinkToken.find({ userId: u._id });
      expect(userMagicLinks.length).toBe(1);
      expect(sendEmailSpy).toHaveBeenCalled();
    });

    it('Should return user with limited permissions and delete token when password is reset', async () => {
      // Arrange
      const u = await user();
      await groupService.create(
        'admins',
        [u._id.toString()],
        GROUP_ADMIN_SCOPES,
      );
      await magicLinkToken.create({
        expirationDate: new Date().getTime() + 100000,
        token: '1234',
        userId: u._id,
        scopes: [RESET_PASSWORD_SCOPE],
      });

      // Act
      const authenticatedUser =
        await userService.validateIdentityUsingUniqueToken('1234');

      // Assert
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser.email).toBe(u.email);
      expect(authenticatedUser.scopes).toBe([RESET_PASSWORD_SCOPE]);

      // Act
      await userService.changePasswordById(u._id.toString(), 'newpass');

      // Assert
      const token = await magicLinkToken.findOne({ userId: u._id });
      expect(token).toBeNull();
    });

    it('Should not return access token when magic token is expired', async () => {
      // Arrange
      const u = await user();
      await magicLinkToken.create({
        expirationDate: new Date().getTime() - 1,
        token: '1234',
        userId: u._id,
      });

      // Act
      const authenticatedUser =
        await userService.validateIdentityUsingUniqueToken('1234');

      // Assert
      expect(authenticatedUser).toBeUndefined();
    });

    it('Should not return access token when magic token does not exist', async () => {
      // Arrange
      // Act
      const authenticatedUser =
        await userService.validateIdentityUsingUniqueToken('idontexist');

      // Assert
      expect(authenticatedUser).toBeUndefined();
    });
  });

  /**
   *
   * @param u Creates an admin filled with random values
   * @returns
   */
  async function user(u: Partial<User> = {}): Promise<UserDocument> {
    if (!u.email) u.email = `${getName(prefix)}@red-kite.io`;
    if (!u.firstName) u.firstName = getName(prefix);
    if (!u.lastName) u.lastName = getName(prefix);
    if (!u.password) u.password = getName(prefix);
    if (typeof u.active === 'undefined') u.active = true;

    return await userService.createUser(u);
  }
});
