import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CreateFirstUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('/firstUser')
export class FirstUserController {
  private logger = new Logger(FirstUserController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * This method is intentionnally without authentication and authorization guards
   * because it can only create the first user, and will return an error otherwise
   * @param dto
   */
  @Post()
  public async createFirstUser(@Body() dto: CreateFirstUserDto) {
    await this.usersService.createFirstUser(dto);
    return;
  }
}
