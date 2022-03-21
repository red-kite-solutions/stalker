import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { StringStatusResponse } from 'src/utils/reponse-objects.utils';
import {
  ChangePasswordDto,
  CreateUserDto,
  EditProfileDto,
  EditUserDto,
} from './users.dto';
import { User } from './users.model';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Post()
  public async createUser(
    @Request() req,
    @Body(new ValidationPipe()) dto: CreateUserDto,
  ): Promise<StringStatusResponse> {
    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );
    if (valid === null) {
      return { status: 'Error' };
    }

    if (valid) {
      try {
        await this.usersService.createUser({
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: dto.password,
          role: dto.role,
          active: dto.active,
        });
        return { status: 'Success' };
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key error
          return { status: 'Already exists' };
        } else {
          return { status: 'Error' };
        }
      }
    } else {
      return { status: 'Invalid password' };
    }
  }

  @Roles(Role.Admin)
  @Get()
  public async getUsers(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Roles(Role.ReadOnly)
  @Get('profile')
  public async getProfile(@Request() req): Promise<User> {
    return await this.usersService.findOneByEmail(req.user.email);
  }

  @Roles(Role.ReadOnly)
  @Put('profile')
  public async editProfile(
    @Request() req,
    @Body(new ValidationPipe()) dto: EditProfileDto,
  ): Promise<StringStatusResponse> {
    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );
    if (valid === null) {
      return { status: 'Error' };
    }

    if (valid) {
      try {
        await this.usersService.editUserByEmail(req.user.email, {
          // email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
        });
        return { status: 'Success' };
      } catch (err) {
        return { status: 'Error' };
      }
    } else {
      return { status: 'Invalid password' };
    }
  }

  @Roles(Role.ReadOnly)
  @Put('profile/password')
  public async changePassword(
    @Request() req,
    @Body(new ValidationPipe()) dto: ChangePasswordDto,
  ): Promise<StringStatusResponse> {
    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );
    if (valid === null) {
      return { status: 'Error' };
    }

    if (valid) {
      await this.usersService.changePasswordByEmail(
        req.user.email,
        dto.newPassword,
      );
      return { status: 'Success' };
    } else {
      return { status: 'Invalid password' };
    }
  }

  @Roles(Role.Admin)
  @Get(':id')
  public async getUser(@Param('id') id: string): Promise<User> {
    return await this.usersService.findOneById(id);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  public async deleteUser(
    @Param('id') id: string,
  ): Promise<StringStatusResponse> {
    try {
      await this.usersService.deleteUserById(id);
      return { status: 'Success' };
    } catch (err) {
      return { status: 'Error' };
    }
  }

  @Roles(Role.Admin)
  @Put(':id')
  public async editUser(
    @Request() req,
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: EditUserDto,
  ): Promise<StringStatusResponse> {
    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );
    if (valid === null) {
      return { status: 'Error' };
    }

    if (valid) {
      try {
        await this.usersService.editUserById(id, {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          active: dto.active,
        });
        return { status: 'Success' };
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key error
          return { status: 'Already exists' };
        } else {
          return { status: 'Error' };
        }
      }
    } else {
      return { status: 'Invalid password' };
    }
  }

  @Roles(Role.Admin)
  @Put(':id/password')
  public async editUserPassword(
    @Request() req,
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: ChangePasswordDto,
  ): Promise<StringStatusResponse> {
    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );
    if (valid === null) {
      return { status: 'Error' };
    }

    if (valid) {
      await this.usersService.changePasswordById(id, dto.newPassword);
      return { status: 'Success' };
    } else {
      return { status: 'Invalid password' };
    }
  }
}
