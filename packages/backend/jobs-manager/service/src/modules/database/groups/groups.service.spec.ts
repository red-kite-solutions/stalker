import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Group } from './groups.model';
import { GroupsService } from './groups.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.model';
import { simplifyScopes } from '../../auth/utils/auth.utils';

describe('Users Service', () => {
  let moduleFixture: TestingModule;
  let groupService: GroupsService;
  let userService: UsersService;
  let groupModel: Model<Group>;
  let userModel: Model<User>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    groupService = moduleFixture.get(GroupsService);
    groupModel = moduleFixture.get<Model<Group>>(getModelToken('groups'));
    userService = moduleFixture.get(UsersService);
    userModel = moduleFixture.get<Model<User>>(getModelToken('users'));
  });

  beforeEach(async () => {
    await groupModel.deleteMany({});
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('CRUD groups', () => {
    it('Should create a group', async () => {
      // Arrange && Act
      const g = await group('a');

      // Assert
      expect(g.name).toStrictEqual('a');
    });

    it('Should get a group', async () => {
      // Arrange
      const g = await group('a');

      // Act
      const g2 = await groupService.get(g._id.toString());

      // Assert
      expect(g._id.toString()).toStrictEqual(g2._id.toString());
    });

    it('Should get all groups', async () => {
      // Arrange
      const g = await group('a');
      const g2 = await group('b');

      // Act
      const gAll = await groupService.getAll();

      // Assert
      expect(gAll.length).toStrictEqual(2);
    });

    it('Should delete a group', async () => {
      // Arrange
      const g = await group('a');
      const g2 = await group('b');

      // Act
      const gAll = await groupService.getAll();

      // Assert
      expect(gAll.length).toStrictEqual(2);
    });
  });

  describe('Group memberships and scopes', () => {
    it('Should create a group with scopes', async () => {
      // Arrange
      const scopes = ['qwerty', 'asdf:*', 'asdf:qwerty'];

      // Act
      const g = await group('a', [], scopes);

      // Assert
      expect(g.scopes).toStrictEqual(['asdf:*', 'qwerty']);
    });

    it('Should find groups for a user', async () => {
      // Arrange
      const u1 = await user('admin@example.com');
      const scopes = ['qwerty', 'asdf:*', 'asdf:qwerty'];
      const g1 = await group('a', [u1._id.toString()], scopes);
      const g2 = await group('b', [], scopes);
      const g3 = await group('c', [u1._id.toString()], scopes);

      // Act
      const groups = await groupService.getGroupMemberships(u1._id.toString());

      // Assert
      expect(groups.map((g) => g._id.toString())).toStrictEqual([
        g1._id.toString(),
        g3._id.toString(),
      ]);
    });

    it('Should find scopes for a user', async () => {
      // Arrange
      const u1 = await user('admin@example.com');
      const scopes = ['qwerty', 'asdf:*', 'asdf:qwerty', 'uiop:asdf'];
      const scopes2 = ['qwerty', 'asdf:*', 'asdf:qwerty', 'uiop:*'];
      const g1 = await group('a', [u1._id.toString()], scopes);
      const g2 = await group('b', [], scopes);
      const g3 = await group('c', [u1._id.toString()], scopes2);

      // Act
      const foundScopes = await groupService.getUserScopes(u1._id.toString());

      // Assert
      expect(foundScopes).toStrictEqual(
        simplifyScopes([...g1.scopes, ...g3.scopes]),
      );
    });

    it('Should remove the membership to all groups for a user', async () => {
      // Arrange
      const u1 = await user('admin@example.com');
      const scopes = ['qwerty', 'asdf:*', 'asdf:qwerty', 'uiop:asdf'];
      const g1 = await group('a', [u1._id.toString()], scopes);
      const g2 = await group('b', [], scopes);
      const g3 = await group('c', [u1._id.toString()], scopes);

      // Act
      await groupService.removeGroupMemberships(u1._id.toString());

      // Assert
      const groups = await groupService.getGroupMemberships(u1._id.toString());
      expect(groups.length).toStrictEqual(0);
    });
  });

  async function group(
    name: string,
    members: string[] = [],
    scopes: string[] = [],
  ) {
    return await groupService.create(name, members, scopes);
  }

  async function user(email: string) {
    return await userService.createUser({
      active: true,
      email: email,
      firstName: 'a',
      lastName: 'b',
      password: '12345678',
    });
  }
});
