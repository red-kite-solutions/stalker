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
} from 'src/exceptions/http.exceptions';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import {
  ChangePasswordDto,
  CreateUserDto,
  EditProfileDto,
  EditUserDto,
} from './users.dto';
import { User, UserDocument } from './users.model';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('/users')
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

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

  @Roles(Role.ReadOnly)
  @Get('profile')
  public async getProfile(@Request() req): Promise<User> {
    try {
      return await this.usersService.findOneByEmail(req.user.email);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.ReadOnly)
  @Put('profile')
  public async editProfile(
    @Request() req,
    @Body(new ValidationPipe()) dto: EditProfileDto,
  ): Promise<void> {
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
      await this.usersService.editUserByEmail(req.user.email, {
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.ReadOnly)
  @Put('profile/password')
  public async changePassword(
    @Request() req,
    @Body(new ValidationPipe()) dto: ChangePasswordDto,
  ): Promise<void> {
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
      await this.usersService.changePasswordByEmail(
        req.user.email,
        dto.newPassword,
      );
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.Admin)
  @Get(':id')
  public async getUser(@Param('id') id: string): Promise<User> {
    return await this.usersService.findOneById(id);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  public async deleteUser(@Param('id') id: string): Promise<void> {
    try {
      return await this.usersService.deleteUserById(id);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.Admin)
  @Put(':id')
  public async editUser(
    @Request() req,
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: EditUserDto,
  ): Promise<void> {
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
      await this.usersService.editUserById(id, {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        active: dto.active,
      });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  @Roles(Role.Admin)
  @Put(':id/password')
  public async editUserPassword(
    @Request() req,
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: ChangePasswordDto,
  ): Promise<void> {
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
}
