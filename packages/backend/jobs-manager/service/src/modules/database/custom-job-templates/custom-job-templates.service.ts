import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import { HttpNotFoundException } from '../../../exceptions/http.exceptions';
import { CustomJobTemplateSummary } from '../../../types/custom-job-template-summary.type';
import {
  JobContainer,
  JobContainerDocument,
} from '../container/job-container.model';
import { CustomJobTemplateDto } from './custom-job-templates.dto';
import { CustomJobTemplate } from './custom-job-templates.model';

@Injectable()
export class CustomJobTemplateService {
  private logger = new Logger(CustomJobTemplateService.name);

  constructor(
    @InjectModel('customJobTemplates')
    private readonly templateModel: Model<CustomJobTemplate>,
    @InjectModel('jobContainers')
    private readonly containersModel: Model<JobContainer>,
  ) {}

  public async create(dto: CustomJobTemplateDto) {
    const container: JobContainerDocument = await this.containersModel.findById(
      dto.containerId,
    );

    if (!container) throw new HttpNotFoundException('Container id not found');

    let category = dto.category;
    if (category != null && category[0] != '/') {
      category = '/' + category;
    }

    const template: CustomJobTemplate = {
      name: dto.name,
      code: dto.code,
      type: dto.type,
      language: dto.language,
      findingHandlerEnabled: dto.findingHandlerEnabled,
      findingHandler: dto.findingHandler ?? undefined,
      findingHandlerLanguage: dto.findingHandlerLanguage ?? undefined,
      category: category,
      jobPodConfigId: new Types.ObjectId(dto.jobPodConfigId),
      parameters: [],
      source: dto.source,
      container: {
        id: container._id,
        image: container.image,
      },
    };
    return await this.templateModel.create(template);
  }

  public async getAll() {
    return await this.templateModel.find({});
  }

  public async get(id: string) {
    return await this.templateModel.findById(id);
  }

  public async getAllSummaries(): Promise<CustomJobTemplateSummary[]> {
    return await this.templateModel.find().select(['_id', 'name', 'category']);
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.templateModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }
}
