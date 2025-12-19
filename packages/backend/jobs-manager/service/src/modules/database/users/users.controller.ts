import {
  BadRequestException,
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
import { AuthGuard } from '@nestjs/passport';
import { DeleteResult } from 'mongodb';
import {
  HttpConflictException,
  HttpForbiddenException,
  HttpServerErrorException,
} from '../../../exceptions/http.exceptions';
import { MongoIdDto } from '../../../types/dto/mongo-id.dto';
import { ApiDefaultResponseExtendModelId } from '../../../utils/swagger.utils';
import { AuthenticatedRequest } from '../../auth/auth.types';
import { Scopes } from '../../auth/decorators/scopes.decorator';
import { ScopesGuard } from '../../auth/guards/scope.guard';
import {
  MANAGE_USER_READ_ALL_SCOPE,
  MANAGE_USER_UPDATE_ALL_SCOPE,
  RESET_PASSWORD_SCOPE,
} from '../../auth/scopes.constants';
import { ApiKeyStrategy } from '../../auth/strategies/api-key.strategy';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { userHasScope } from '../../auth/utils/auth.utils';
import { MONGO_DUPLICATE_ERROR } from '../database.constants';
import { Group, GroupDocument } from '../groups/groups.model';
import { ResetPasswordRequestDto } from './reset-password-request.dto';
import { ChangePasswordDto, CreateUserDto, EditUserDto } from './users.dto';
import { User, UserDocument } from './users.model';
import { UsersService } from './users.service';

@UseGuards(AuthGuard([JwtStrategy.name, ApiKeyStrategy.name]), ScopesGuard)
@Controller('/users')
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Read multiple users.
   *
   * @remarks
   * Read multiple users.
   */
  @ApiDefaultResponseExtendModelId([User])
  @Scopes('manage:users:read-all')
  @Get()
  public async getUsers(): Promise<User[]> {
    try {
      return await this.usersService.findAll();
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  /**
   * Read a user's groups.
   *
   * @remarks
   * Read the groups in which a user is a member.
   */
  @ApiDefaultResponseExtendModelId([Group])
  @Scopes('manage:groups:read')
  @Get(':id/groups')
  public async getUserGroups(
    @Param() dto: MongoIdDto,
  ): Promise<GroupDocument[]> {
    try {
      return await this.usersService.getUserGroups(dto.id);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  /**
   * Create a new user.
   *
   * @remarks
   * Create a new user.
   */
  @ApiDefaultResponseExtendModelId(User)
  @Scopes('manage:users:create')
  @Post()
  public async createUser(
    @Request() req: AuthenticatedRequest,
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

  /**
   * Read a user by ID.
   *
   * @remarks
   * Read the current user, or any user information, depending on the current user scopes.
   */
  @ApiDefaultResponseExtendModelId(User)
  @Scopes(['manage:users:read', MANAGE_USER_READ_ALL_SCOPE], { mode: 'oneOf' })
  @Get(':id')
  public async getUser(
    @Request() req: AuthenticatedRequest,
    @Param() dto: MongoIdDto,
  ): Promise<User> {
    if (
      !userHasScope(MANAGE_USER_READ_ALL_SCOPE, req.user.scopes) &&
      req.user.id !== dto.id
    ) {
      throw new HttpForbiddenException();
    }
    try {
      return await this.usersService.findOneById(dto.id);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  /**
   * Modify a user by ID.
   *
   * @remarks
   * Modify the current user, or any user information, depending on the current user scopes.
   */
  @Scopes(['manage:users:update', MANAGE_USER_UPDATE_ALL_SCOPE], {
    mode: 'oneOf',
  })
  @Put(':id')
  public async editUser(
    @Request() req: AuthenticatedRequest,
    @Param() idDto: MongoIdDto,
    @Body() dto: EditUserDto,
  ): Promise<void> {
    const canEditUsers = userHasScope(
      MANAGE_USER_UPDATE_ALL_SCOPE,
      req.user.scopes,
    );
    if (!canEditUsers && req.user.id !== idDto.id) {
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

    if (canEditUsers) {
      if (dto.active || dto.active === false) update.active = dto.active;
      if (dto.email) update.email = dto.email;
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

  /**
   * Modify a user's password.
   *
   * @remarks
   * Modify the current user, or any user's password, depending on the current user scopes.
   *
   * This route is also used when reseting a password following a password reset request.
   */
  @Scopes(
    [RESET_PASSWORD_SCOPE, 'manage:users:update', MANAGE_USER_UPDATE_ALL_SCOPE],
    { mode: 'oneOf' },
  )
  @Put(':id/password')
  public async editUserPassword(
    @Request() req: AuthenticatedRequest,
    @Param() idDto: MongoIdDto,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    if (
      !userHasScope(MANAGE_USER_UPDATE_ALL_SCOPE, req.user.scopes) &&
      req.user.id !== idDto.id
    ) {
      throw new HttpForbiddenException();
    }

    // If the user is not resetting their password, validate the current password
    if (!userHasScope(RESET_PASSWORD_SCOPE, req.user.scopes)) {
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
    }

    try {
      await this.usersService.changePasswordById(idDto.id, dto.newPassword);
    } catch (err) {
      this.logger.error(err);
      throw new HttpServerErrorException();
    }
  }

  /**
   * Delete a user.
   *
   * @remarks
   * Delete a user.
   */
  @Scopes('manage:users:delete')
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

@Controller('/users')
export class UnprotectedUsersController {
  private logger = new Logger(UnprotectedUsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Send a reset password email to a user.
   *
   * @remarks
   * This route is unprotected on purpose. It allows users to request a reset
   * password link sent to their email address.
   */
  @Post('reset-password-requests')
  async requestPasswordReset(@Body() dto: ResetPasswordRequestDto) {
    if (!dto.email) throw new BadRequestException();

    // We fire-and-forget the password reset link task
    void this.usersService.createPasswordResetRequest(dto.email);
  }
}
