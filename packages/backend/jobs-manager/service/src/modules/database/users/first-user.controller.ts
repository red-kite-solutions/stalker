import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CreateFirstUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('/firstUser')
export class FirstUserController {
  private logger = new Logger(FirstUserController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Create the application first user.
   *
   * @remarks
   * This method can only create the first user, and will return an error otherwise.
   *
   * This method is intentionnally without authentication and authorization guards.
   */
  @Post()
  public async createFirstUser(@Body() dto: CreateFirstUserDto) {
    await this.usersService.createFirstUser(dto);
    return;
  }
}
