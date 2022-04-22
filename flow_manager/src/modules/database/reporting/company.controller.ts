import {
  Body,
  Controller,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from 'src/modules/auth/constants';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/role.guard';
import { CreateCompanyDto } from './company.dto';
import { CompanyService } from './company.service';

@Roles(Role.User)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  async createCompany(@Body(new ValidationPipe()) dto: CreateCompanyDto) {
    return await this.companyService.addCompany(dto);
  }
}
