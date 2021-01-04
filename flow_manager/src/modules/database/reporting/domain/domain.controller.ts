import { Body, Controller, Get, HttpException, Param, Post, ValidationPipe } from '@nestjs/common';
import { SubmitSubdomainDto } from './domain.dto';
import { Domain } from './domain.model';
import { DomainsService } from './domain.service';


@Controller('report/domains')
export class DomainsController {
    constructor(private readonly domainsService: DomainsService) {}

    @Post(':jobId')
    async submitSubdomains(@Param('jobId') jobId: string, @Body(new ValidationPipe()) subdomains: SubmitSubdomainDto): Promise<void> {
        await this.domainsService.addDomains(subdomains, jobId);
        return;
    }
}
