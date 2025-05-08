import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { FilterQuery, Model, Types, UpdateWriteOpResult } from 'mongoose';
import {
  HttpBadRequestException,
  HttpForbiddenException,
  HttpNotFoundException,
} from '../../../exceptions/http.exceptions';
import { Role, resetPasswordConstants } from '../../auth/constants';
import { hashPassword, passwordEquals } from '../../auth/utils/auth.utils';
import { CreateFirstUserDto } from './users.dto';

import { randomBytes } from 'crypto';
import { EmailService } from '../../notifications/emails/email.service';
import { ApiKeyService } from '../api-key/api-key.service';
import { MagicLinkToken } from './magic-link-token.model';
import { ScopedUserDocument, User, UserDocument } from './users.model';
import { USER_INIT } from './users.provider';
import { GroupsService } from '../groups/groups.service';
import { ADMIN_GROUP } from '../groups/groups.constants';
import { RESET_PASSWORD_SCOPE } from '../../auth/scopes.constants';

@Injectable()
export class UsersService {
  protected logger: Logger;

  constructor(
    @InjectModel('users') private readonly userModel: Model<User>,
    @InjectModel('magicLinkTokens')
    private readonly uniqueTokenModel: Model<MagicLinkToken>,
    @Inject(USER_INIT) userProvider,
    private emailService: EmailService,
    private apiKeyService: ApiKeyService,
    private groupsService: GroupsService,
  ) {
    this.logger = new Logger('UsersService');
  }

  /**
   * Tells if the first user of the application has been created
   * @returns True if created, false otherwise
   */
  public async isFirstUserCreated() {
    const u = await this.userModel.findOne({});
    return !!u;
  }

  /**
   * Creates the first user of the application. The call to this method will
   * fail by throwing a HttpForbiddenException if there is already a user in the database
   * @param user
   */
  public async createFirstUser(user: CreateFirstUserDto) {
    const err = 'Application already initialized';
    // This first check looks for a user without locking the DB
    // It works 99% of the time and it prevents an external user
    // from having the power to lock the user collection at will.
    if (await this.isFirstUserCreated()) throw new HttpForbiddenException(err);

    const userToCreate: User = {
      active: true,
      refreshTokens: [],
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: await hashPassword(user.password),
    };

    // This second check looks for a user while locking the DB
    // It prevents a potential race condition on the first setup allowing
    // the creation of multiple first users.
    const session = await this.userModel.startSession();
    try {
      await session.withTransaction(async () => {
        const u = await this.userModel.findOne({}, undefined, { session });
        if (u) throw new HttpForbiddenException(err);
        const user = await this.userModel.create([userToCreate], { session });
        await this.groupsService.addToGroupByName(
          ADMIN_GROUP.name,
          user[0]._id.toString(),
        );
      });
    } finally {
      await session.endSession();
    }
  }

  public async createUser(dto: Partial<User>): Promise<UserDocument> {
    const pass: string = await hashPassword(dto.password);

    const user: User & any = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: pass,
      active: dto.active,
      refreshToken: '',
    };
    let newUser = await this.userModel.create(user);
    user.password = '********';
    user._id = newUser._id;
    return user;
  }

  public findAll() {
    return this.userModel.find({});
  }

  public async getUserGroups(id: string) {
    return await this.groupsService.getGroupMemberships(id);
  }

  public async findOneByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email: { $eq: email } });
  }

  public async findOneById(id: string): Promise<User> {
    return await this.userModel.findById(new Types.ObjectId(id));
  }

  /**
   * Returns a user found by email. Unless you really need the hash, do not use this function
   * Use findOneByEmail instead.
   * @param email
   * @returns
   */
  public async findOneByEmailIncludeHash(email: string): Promise<User> {
    return await this.userModel
      .findOne({ email: { $eq: email } })
      .select('+password')
      .lean();
  }

  public async editUserByEmail(
    email: string,
    userEdits: Partial<User>,
  ): Promise<UpdateWriteOpResult> {
    return await this.editUser({ email: { $eq: email } }, userEdits);
  }

  public async editUserById(
    id: string,
    userEdits: Partial<User>,
  ): Promise<UpdateWriteOpResult> {
    return await this.editUser(
      { _id: { $eq: new Types.ObjectId(id) } },
      userEdits,
    );
  }

  /**
   * Edits a user and avoids the "active" modification of the last admin to prevent bricking Red Kite
   * @param id
   * @param userEdits
   */
  private async editUser(
    selectFilter: FilterQuery<User>,
    userEdits: Partial<User>,
  ): Promise<UpdateWriteOpResult> {
    let result: UpdateWriteOpResult;
    let targetId: Types.ObjectId = undefined;

    if (userEdits.active === false) {
      // We may be deactivating and admin. Therefore, we need to make sure that we don't incapacitate the last admin
      const session = await this.userModel.startSession();

      try {
        await session.withTransaction(async () => {
          const userToEdit = await this.userModel.findOne(
            selectFilter,
            { _id: 1, scopes: 1, active: 1 },
            { session: session },
          );
          if (!userToEdit) throw new HttpNotFoundException(`User not found`);

          const isAdmin = await this.groupsService.isAdmin(
            userToEdit._id.toString(),
            session,
          );

          if (isAdmin && userToEdit.active) {
            // we may be editing the last active admin, more check required
            const adminIds = await this.groupsService.getAdminIds();
            const count = await this.userModel.countDocuments(
              {
                _id: { $in: adminIds },
                active: true,
              },
              { session: session },
            );
            if (count <= 1)
              throw new HttpBadRequestException(
                "The last admin is required and can't be deactivated nor demoted",
              );
          }

          targetId = userToEdit._id;
          result = await this.userModel.updateOne(
            { _id: { $eq: targetId } },
            { ...userEdits },
            {
              session: session,
            },
          );
        });
      } finally {
        await session.endSession();
      }
    } else {
      targetId = (await this.userModel.findOne(selectFilter, '_id'))._id;
      if (!targetId) throw new HttpNotFoundException(`User not found`);
      // We are not deactivating or demoting an admin, therefore a simple edit is enough
      result = await this.userModel.updateOne(
        { _id: { $eq: targetId } },
        { ...userEdits },
      );
    }

    if ((userEdits.active === true || userEdits.active === false) && targetId) {
      await this.apiKeyService.setUserIsActiveStatus(
        targetId.toString(),
        userEdits.active,
      );
    }
    return result;
  }

  public async changePasswordByEmail(
    email: string,
    password: string,
  ): Promise<UpdateWriteOpResult> {
    const pass: string = await hashPassword(password);
    return await this.userModel.updateOne(
      { email: { $eq: email } },
      { password: pass },
    );
  }

  public async changePasswordById(
    userId: string,
    password: string,
  ): Promise<UpdateWriteOpResult> {
    const pass: string = await hashPassword(password);

    await this.uniqueTokenModel.deleteMany({
      userId: { $eq: new Types.ObjectId(userId) },
    });

    return await this.userModel.updateOne(
      { _id: { $eq: new Types.ObjectId(userId) } },
      { password: pass },
    );
  }

  /**
   * Deletes a user by its id. Prevents the deletion of the last admin.
   * @param userId
   * @returns
   */
  public async deleteUserById(userId: string): Promise<DeleteResult> {
    const session = await this.userModel.startSession();
    let result: DeleteResult;
    try {
      await session.withTransaction(async () => {
        const userToDelete = await this.userModel.findById(
          new Types.ObjectId(userId),
          { _id: 1, scopes: 1, active: 1 },
          { session: session },
        );

        const isAdmin = await this.groupsService.isAdmin(
          userToDelete._id.toString(),
          session,
        );

        if (!userToDelete) {
          throw new HttpNotFoundException(`User ${userId} not found`);
        }

        if (isAdmin && userToDelete.active) {
          // we may be deleting the last active admin, more checks required
          const currentAdmins = await this.groupsService.getAdminIds();
          const count = await this.userModel.countDocuments(
            {
              _id: { $in: currentAdmins },
              active: true,
            },
            { session: session },
          );
          if (count <= 1) {
            throw new HttpBadRequestException("Can't delete the last admin");
          }
        }
        result = await this.userModel.deleteOne(
          {
            _id: { $eq: new Types.ObjectId(userId) },
          },
          { session: session },
        );
      });
    } finally {
      await session.endSession();
    }

    await this.apiKeyService.deleteAllForUser(userId);

    return result;
  }

  public async validateIdentity(
    email: string,
    password: string,
  ): Promise<boolean | null> {
    const user: User = await this.findOneByEmailIncludeHash(email);
    if (user) {
      return await passwordEquals(user.password, password);
    } else {
      return null;
    }
  }

  public async validateIdentityUsingUniqueToken(
    token: string,
  ): Promise<Partial<ScopedUserDocument>> {
    const existingToken = await this.uniqueTokenModel.findOne({
      token,
      expirationDate: { $gt: Date.now() },
    });

    if (!existingToken) return undefined;

    const user: User & { _id: Types.ObjectId } = await this.userModel.findById(
      new Types.ObjectId(existingToken.userId),
      undefined,
      { lean: true },
    );

    return {
      ...user,
      scopes: existingToken.scopes,
    };
  }

  public async setRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    const hash: string = await hashPassword(refreshToken);

    // Keep only the 15 most recent refresh tokens
    await this.userModel.updateOne(
      { _id: { $eq: new Types.ObjectId(userId) } },
      { $push: { refreshTokens: { $each: [hash], $slice: -15 } } },
    );
  }

  public async getUserIfRefreshTokenMatches(
    refreshToken: string,
    id: string,
  ): Promise<Partial<ScopedUserDocument>> {
    if (refreshToken) {
      const user = await this.userModel
        .findOne({ _id: { $eq: new Types.ObjectId(id) } }, '+refreshTokens')
        .lean();
      for (let rt of user.refreshTokens) {
        if (rt && (await passwordEquals(rt, refreshToken))) {
          const scopes = await this.groupsService.getUserScopes(
            user._id.toString(),
          );
          return { refreshTokens: null, scopes: scopes, ...user };
        }
      }
    }
    return null;
  }

  public async removeRefreshToken(userId: string, refreshToken: string) {
    if (!refreshToken) {
      await this.userModel.updateOne(
        { _id: { $eq: new Types.ObjectId(userId) } },
        { refreshTokens: [] },
      );
      return;
    }

    const user = await this.userModel.findOne(
      { _id: { $eq: new Types.ObjectId(userId) } },
      '+refreshTokens',
    );

    let i = 0;
    for (let rt of user.refreshTokens) {
      if (rt && (await passwordEquals(rt, refreshToken))) {
        user.refreshTokens.splice(i, 1);
        await user.save();
        return;
      }
      i++;
    }

    await this.userModel.updateOne(
      { _id: { $eq: new Types.ObjectId(userId) } },
      { refreshTokens: [] },
    );
  }

  public async isUserActive(userId: string): Promise<boolean> {
    const user = await this.findOneById(userId);
    return user?.active;
  }

  public async createPasswordResetRequest(email: string) {
    // If the user does not exist, we gracefully end the request.
    const user = await this.userModel.findOne({ email: { $eq: email } });
    if (!user) return;

    const ttl = resetPasswordConstants.expirationTimeSeconds * 1000;
    const token = randomBytes(64).toString('hex');
    const now = new Date();
    const expirationDate = new Date(now.getTime() + ttl);

    this.logger.log('Creating unique reset password token.');
    await this.uniqueTokenModel.create({
      token,
      userId: user._id,
      expirationDate: expirationDate.getTime(),
      scopes: [RESET_PASSWORD_SCOPE],
    });

    const link = `${process.env.RK_APP_BASE_URL}/auth/reset?token=${token}`;
    await this.emailService.sendResetPassword(
      {
        link,
        validHours: ttl / 1000 / 60 / 60,
      },
      [
        {
          email,
          name: [user.firstName, user.lastName]
            .filter((x) => x && x.trim() != '')
            .join(' '),
        },
      ],
    );
  }
}
