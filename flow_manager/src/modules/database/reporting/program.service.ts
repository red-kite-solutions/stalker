import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from '../../../services/base.service';
import { CreateProgramDto } from './program.dto';
import { Model } from 'mongoose';
import { Program } from './program.model';

@Injectable()
export class ProgramService extends BaseService<Program> {
  constructor(
    @InjectModel('program') private readonly programModel: Model<Program>,
  ) {
    super(programModel);
  }

  public async findAllPrograms() {
    return await this.findAll();
  }

  public async findOneByName(name: string): Promise<Program> {
    return await this.findOne({ name: name });
  }

  public async addProgram(dto: CreateProgramDto) {
    // create the program if not exist
    const program: Program = await this.findOne({
      name: dto.name,
    });

    if (program) {
      throw new BadRequestException('This bug bounty program already exists.');
    }

    return await this.create({
      ...dto,
    });
  }
}
