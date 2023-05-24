import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { FilterQuery, Model, Types, UpdateWriteOpResult } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../exceptions/http.exceptions';
import { Role } from '../../auth/constants';
import { hashPassword, passwordEquals } from '../../auth/utils/auth.utils';

import { User } from './users.model';
import { USER_INIT } from './users.provider';

@Injectable()
export class UsersService {
  private options = {
    timeCost: 5,
  };

  constructor(
    @InjectModel('users') private readonly userModel: Model<User>,
    @Inject(USER_INIT) userProvider,
  ) {}

  public async createUser(dto: Partial<User>): Promise<any> {
    const pass: string = await hashPassword(dto.password);

    const user: User & any = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: pass,
      active: dto.active,
      role: dto.role,
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
   * Edits a user and avoids the role/active modification of the last admin to prevent bricking Stalker
   * @param id
   * @param userEdits
   */
  private async editUser(
    selectFilter: FilterQuery<User>,
    userEdits: Partial<User>,
  ): Promise<UpdateWriteOpResult> {
    let result: UpdateWriteOpResult;
    if (
      userEdits.active === false ||
      (typeof userEdits.role !== 'undefined' && userEdits.role !== Role.Admin)
    ) {
      // We may change an admin to a less privileged role. Therefore, we need to make sure that we don't incapacitate the last admin
      const session = await this.userModel.startSession();

      try {
        await session.withTransaction(async () => {
          const userToEdit = await this.userModel.findOne(
            selectFilter,
            { _id: 1, role: 1, active: 1 },
            { session: session },
          );
          if (!userToEdit) throw new HttpNotFoundException(`User not found`);
          if (userToEdit.role === Role.Admin && userToEdit.active) {
            // we may be editing the last active admin, more check required
            const count = await this.userModel.countDocuments(
              {
                role: { $eq: Role.Admin },
                active: true,
              },
              { session: session },
            );
            if (count <= 1)
              throw new HttpBadRequestException(
                "The last admin is required and can't be deactivated nor demoted",
              );
          }

          result = await this.userModel.updateOne(
            selectFilter,
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
      // We are not deactivating or demoting an admin, therefore a simple edit is enough
      result = await this.userModel.updateOne(selectFilter, { ...userEdits });
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
    id: string,
    password: string,
  ): Promise<UpdateWriteOpResult> {
    const pass: string = await hashPassword(password);
    return await this.userModel.updateOne(
      { _id: { $eq: new Types.ObjectId(id) } },
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
          { _id: 1, role: 1, active: 1 },
          { session: session },
        );

        if (!userToDelete) {
          throw new HttpNotFoundException(`User ${userId} not found`);
        }

        if (userToDelete.role === Role.Admin && userToDelete.active) {
          // we may be deleting the last active admin, more checks required
          const count = await this.userModel.countDocuments(
            {
              role: { $eq: Role.Admin },
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
  ): Promise<User> {
    if (refreshToken) {
      const user = await this.userModel
        .findOne({ _id: { $eq: new Types.ObjectId(id) } }, '+refreshTokens')
        .lean();
      for (let rt of user.refreshTokens) {
        if (rt && (await passwordEquals(rt, refreshToken))) {
          return { refreshTokens: null, ...user };
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
}
