import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  HttpConflictException,
  HttpServerErrorException,
} from 'src/exceptions/http.exceptions';
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
    try {
      return await this.companyService.addCompany(dto);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        throw new HttpConflictException();
      }
      throw new HttpServerErrorException();
    }
  }

  @Delete(':id')
  async deleteCompany(@Param('id') id: string) {
    return await this.companyService.delete(id);
  }
}
