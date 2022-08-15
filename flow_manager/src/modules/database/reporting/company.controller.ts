import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { CreateCompanyDto } from './company.dto';
import { CompanyService } from './company.service';

// @Roles(Role.User)
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  async createCompany(@Body(new ValidationPipe()) dto: CreateCompanyDto) {
    return await this.companyService.addCompany(dto);
  }
}
