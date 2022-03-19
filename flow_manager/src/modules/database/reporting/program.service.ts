import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProgramDto } from './program.dto';
import { Program } from './program.model';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel('program') private readonly programModel: Model<Program>,
  ) {}

  public async getAll(
    page = 0,
    pageSize = 100,
    nameFilter: string = null,
  ): Promise<Program[]> {
    if (nameFilter != null) {
      return await this.programModel
        .find({ name: { $eq: nameFilter } })
        .skip(page)
        .limit(pageSize);
    } else {
      return await this.programModel.find().skip(page).limit(pageSize);
    }
  }

  /**
   * This method is used to limit data transportation between the database and this server.
   * It will return a shortened version of the Program, with the Domain at the current index as the only
   * Domain in the Domains array.
   * @param program The program in which to get the domain
   * @param index The index of the desired domain in the domains array
   * @returns The program with the shortened domains array
   */
  public async get(name: string): Promise<Program> {
    return await this.programModel.findOne({ name: { $eq: name } }).exec();
  }

  /**
   * This method is used to limit data transportation between the database and this server.
   * It will return a shortened version of the Program, with the Domain at the current index as the only
   * Domain in the Domains array.
   * @param program The program in which to get the domain
   * @param index The index of the desired domain in the domains array
   * @returns The program with the shortened domains array
   */
  public async getWithDomainAtIndex(
    name: string,
    index: number,
  ): Promise<Program> {
    return await this.programModel
      .findOne({ name: { $eq: name } }, { domains: { $slice: [index, 1] } })
      .exec();
  }

  public async addProgram(dto: CreateProgramDto) {
    // TODO: Add unique index on name to prevent duplicate programs
    // if (program) {
    //   throw new BadRequestException('This bug bounty program already exists.');
    // }

    return await new this.programModel(dto).save();
  }

  public async update(name: string, program: Program) {
    await this.programModel.updateOne({ name: { $eq: name } }, program);
  }
}
