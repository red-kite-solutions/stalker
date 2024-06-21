import { Controller } from '@nestjs/common';
import { WebsiteService } from './website.service';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly portsService: WebsiteService) {}
}
