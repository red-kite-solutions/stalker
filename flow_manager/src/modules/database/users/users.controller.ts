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
import {
  ChangePasswordDto,
  CreateFirstUserDto,
  CreateUserDto,
  EditUserDto,
} from './users.dto';
import { User, UserDocument } from './users.model';
import { UsersService } from './users.service';

@Controller('/users')
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  /**
   * This method is intentionnally without authentication and authorization guards
   * because it can only create the first user, and will return an error otherwise
   * @param dto
   */
  @Post('first')
  public async createFirstUser(@Body() dto: CreateFirstUserDto) {
    await this.usersService.createFirstUser(dto);
    return;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ReadOnly)
  @Put(':id')
  public async editUser(
    @Request() req,
    @Param() idDto: MongoIdDto,
    @Body(new ValidationPipe()) dto: EditUserDto,
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
      if (err.code === 11000) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
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
