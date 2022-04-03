import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { User } from './users.model';

@Injectable()
export class UsersService {
  private options = {
    timeCost: 5,
  };

  constructor(@InjectModel('users') private readonly userModel: Model<User>) {
    this.userModel.findOne({}).then((user: User) => {
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

    return this.userModel.create(user);
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

  public passwordEquals(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  public editUserByEmail(email: string, userEdits: Partial<User>) {
    return this.userModel.update({ email: email }, { ...userEdits });
  }

  public editUserById(id: string, userEdits: Partial<User>) {
    return this.userModel.update({ _id: id }, { ...userEdits });
  }

  public async changePasswordByEmail(email: string, password: string) {
    const pass: string = await argon2.hash(password, this.options);
    return this.userModel.update({ email: email }, { password: pass });
  }

  public async changePasswordById(id: string, password: string) {
    const pass: string = await argon2.hash(password, this.options);
    return this.userModel.update({ _id: id }, { password: pass });
  }

  public deleteUserById(userId: string) {
    return this.userModel.remove({ _id: userId });
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
    await this.userModel.update({ _id: userId }, { refreshToken: hash });
  }

  public async getUserIfRefreshTokenMatches(
    refreshToken: string,
    id: string,
  ): Promise<User> {
    if (refreshToken) {
      const user = await this.userModel
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
    this.userModel.updateOne({ _id: userId }, { refreshToken: '' });
  }

  public async isUserActive(userId: string): Promise<boolean> {
    const user = await this.findOneById(userId);
    return user?.active;
  }
}
