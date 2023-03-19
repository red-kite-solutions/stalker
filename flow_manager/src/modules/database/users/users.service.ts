import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model } from 'mongoose';
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
    return this.userModel.findOne({ email: email });
  }

  public findOneById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  public async findOneByEmailIncludeHash(email: string): Promise<User> {
    return await this.userModel
      .findOne({ email: email })
      .select('+password')
      .lean();
  }

  public async editUserByEmail(
    email: string,
    userEdits: Partial<User>,
  ): Promise<UpdateResult> {
    return await this.userModel.updateOne({ email: email }, { ...userEdits });
  }

  public async editUserById(
    id: string,
    userEdits: Partial<User>,
  ): Promise<UpdateResult> {
    return await this.userModel.updateOne({ _id: id }, { ...userEdits });
  }

  public async changePasswordByEmail(
    email: string,
    password: string,
  ): Promise<UpdateResult> {
    const pass: string = await hashPassword(password);
    return await this.userModel.updateOne({ email: email }, { password: pass });
  }

  public async changePasswordById(
    id: string,
    password: string,
  ): Promise<UpdateResult> {
    const pass: string = await hashPassword(password);
    return await this.userModel.updateOne({ _id: id }, { password: pass });
  }

  public async deleteUserById(userId: string): Promise<DeleteResult> {
    return await this.userModel.deleteOne({ _id: userId });
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
      { _id: userId },
      { $push: { refreshTokens: { $each: [hash], $slice: -15 } } },
    );
  }

  public async getUserIfRefreshTokenMatches(
    refreshToken: string,
    id: string,
  ): Promise<User> {
    if (refreshToken) {
      const user = await this.userModel
        .findOne({ _id: id }, '+refreshTokens')
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
      await this.userModel.updateOne({ _id: userId }, { refreshTokens: [] });
      return;
    }

    const user = await this.userModel.findOne(
      { _id: userId },
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

    await this.userModel.updateOne({ _id: userId }, { refreshTokens: [] });
  }

  public async isUserActive(userId: string): Promise<boolean> {
    const user = await this.findOneById(userId);
    return user?.active;
  }
}
