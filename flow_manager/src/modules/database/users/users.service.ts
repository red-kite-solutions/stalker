import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { BaseService } from 'src/services/base.service';
import { User, UserDocument } from './users.model';

@Injectable()
export class UsersService extends BaseService<User> {
  private options = {
    timeCost: 5,
  };

  constructor(@InjectModel('users') private readonly userModel: Model<User>) {
    super(userModel);
    this.findOne({}).then((user: User) => {
      if (!user) {
        this.createUser({
          email: 'admin@stalker.io',
          firstName: 'stalker',
          lastName: 'admin',
          password: 'admin',
          active: true,
          role: 'admin',
        });
      }
    });
  }

  public async createUser(dto: Partial<User>): Promise<any> {
    const pass: string = await argon2.hash(dto.password, this.options);

    const user: User = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: pass,
      active: dto.active,
      role: dto.role,
      refreshToken: '',
    };

    return this.create(user);
  }

  public findOneByEmail(email: string): Promise<User> {
    return this.findOne({ email: email });
  }

  public findOneById(id: string): Promise<UserDocument> {
    return this.findOne({ _id: id });
  }

  public findOneByEmailIncludeHash(email: string): Promise<User> {
    return this.model
      .findOne({ email: email })
      .select('+password')
      .lean()
      .exec();
  }

  public passwordEquals(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  public editUserByEmail(email: string, userEdits: Partial<User>) {
    return this.update({ email: email }, { ...userEdits });
  }

  public editUserById(id: string, userEdits: Partial<User>) {
    return this.update({ _id: id }, { ...userEdits });
  }

  public async changePasswordByEmail(email: string, password: string) {
    const pass: string = await argon2.hash(password, this.options);
    return this.update({ email: email }, { password: pass });
  }

  public async changePasswordById(id: string, password: string) {
    const pass: string = await argon2.hash(password, this.options);
    return this.update({ _id: id }, { password: pass });
  }

  public deleteUserById(userId: string) {
    return this.remove({ _id: userId });
  }

  public async validateIdentity(
    email: string,
    password: string,
  ): Promise<boolean | null> {
    const user: User = await this.findOneByEmailIncludeHash(email);
    if (user) {
      return await this.passwordEquals(user.password, password);
    } else {
      return null;
    }
  }

  public async setRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<void> {
    const hash: string = await argon2.hash(refreshToken, this.options);
    await this.update({ _id: userId }, { refreshToken: hash });
  }

  public async getUserIfRefreshTokenMatches(
    refreshToken: string,
    id: string,
  ): Promise<UserDocument> {
    if (refreshToken) {
      const user: UserDocument = await this.model
        .findOne({ _id: id }, '+refreshToken')
        .lean();
      if (
        user?.refreshToken &&
        this.passwordEquals(user.refreshToken, refreshToken)
      ) {
        return { refreshToken: null, ...user };
      }
    }
    return null;
  }

  public async removeRefreshToken(userId: string) {
    this.update({ _id: userId }, { refreshToken: '' });
  }

  public async isUserActive(userId: string): Promise<boolean> {
    const user: UserDocument = await this.findOneById(userId);
    return user?.active;
  }
}
