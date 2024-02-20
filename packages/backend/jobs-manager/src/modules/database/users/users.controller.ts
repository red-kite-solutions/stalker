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
} from '@nestjs/common';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpForbiddenException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
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
    @Body() dto: CreateUserDto,
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
      if (err.code === MONGO_DUPLICATE_ERROR) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      this.logger.log(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.ReadOnly)
  @Get(':id')
  public async getUser(
    @Request() req,
    @Param() dto: MongoIdDto,
  ): Promise<User> {
    if (req.user.role !== Role.Admin && req.user.id !== dto.id) {
      throw new HttpForbiddenException();
    }
    try {
      return await this.usersService.findOneById(dto.id);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.ReadOnly)
  @Put(':id')
  public async editUser(
    @Request() req,
    @Param() idDto: MongoIdDto,
    @Body() dto: EditUserDto,
  ): Promise<void> {
    if (req.user.role !== Role.Admin && req.user.id !== idDto.id) {
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
      await this.usersService.editUserById(idDto.id, update);
    } catch (err) {
      if (err.code === MONGO_DUPLICATE_ERROR) {
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
    @Param() idDto: MongoIdDto,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    if (req.user.role !== Role.Admin && req.user.id !== idDto.id) {
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
      await this.usersService.changePasswordById(idDto.id, dto.newPassword);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.Admin)
  @Delete(':id')
  public async deleteUser(@Param() dto: MongoIdDto): Promise<DeleteResult> {
    try {
      return await this.usersService.deleteUserById(dto.id);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }
}
