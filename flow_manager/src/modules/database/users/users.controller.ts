import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  HttpConflictException,
  HttpForbiddenException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';

import { ChangePasswordDto, CreateUserDto, EditUserDto } from './users.dto';
import { User, UserDocument } from './users.model';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/users')
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Get()
  public async getUsers(): Promise<User[]> {
    try {
      return await this.usersService.findAll();
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.Admin)
  @Post()
  public async createUser(
    @Request() req,
    @Body(new ValidationPipe()) dto: CreateUserDto,
  ): Promise<UserDocument> {
    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );
    if (valid === null) {
      throw new HttpServerErrorException();
    }

    if (!valid) {
      throw new HttpForbiddenException();
    }

    try {
      return await this.usersService.createUser({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: dto.password,
        role: dto.role,
        active: dto.active,
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      this.logger.log(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.ReadOnly)
  @Get(':id')
  public async getUser(@Request() req, @Param('id') id: string): Promise<User> {
    if (req.user.role !== Role.Admin && req.user.id !== id) {
      throw new HttpForbiddenException();
    }
    try {
      return await this.usersService.findOneById(id);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.ReadOnly)
  @Put(':id')
  public async editUser(
    @Request() req,
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: EditUserDto,
  ): Promise<void> {
    if (req.user.role !== Role.Admin && req.user.id !== id) {
      throw new HttpForbiddenException();
    }

    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );

    if (valid === null) {
      throw new HttpServerErrorException();
    }

    if (!valid) {
      throw new HttpForbiddenException();
    }

    const update: Partial<User> = {};

    if (req.user.role === Role.Admin) {
      if (dto.active || dto.active === false) update.active = dto.active;
      if (dto.email) update.email = dto.email;
      if (dto.role) update.role = dto.role;
    }

    update.firstName = dto.firstName;
    update.lastName = dto.lastName;

    try {
      await this.usersService.editUserById(id, update);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.ReadOnly)
  @Put(':id/password')
  public async editUserPassword(
    @Request() req,
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: ChangePasswordDto,
  ): Promise<void> {
    if (req.user.role !== Role.Admin && req.user.id !== id) {
      throw new HttpForbiddenException();
    }

    const valid: boolean | null = await this.usersService.validateIdentity(
      req.user.email,
      dto.currentPassword,
    );

    if (valid === null) {
      throw new HttpServerErrorException();
    }

    if (!valid) {
      throw new HttpForbiddenException();
    }

    try {
      await this.usersService.changePasswordById(id, dto.newPassword);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.Admin)
  @Delete(':id')
  public async deleteUser(@Param('id') id: string) {
    try {
      return await this.usersService.deleteUserById(id);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }
}
