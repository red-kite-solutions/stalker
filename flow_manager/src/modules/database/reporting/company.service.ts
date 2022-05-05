import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCompanyDto } from './company.dto';
import { Company, CompanyDocument } from './company.model';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel('company') private readonly companyModel: Model<Company>,
  ) {}

  public async getAll(
    page: number = null,
    pageSize: number = null,
  ): Promise<Company[]> {
    let query = this.companyModel.find();
    if (page != null && pageSize != null) {
      query = query.skip(page).limit(pageSize);
    }

    return await query;
  }

  /**
   * This method returns the company with the id provided
   * @param id
   * @returns A company object document
   */
  public async get(id: string): Promise<CompanyDocument> {
    return await this.companyModel.findOne({ _id: { $eq: id } }).exec();
  }

  public async addCompany(dto: CreateCompanyDto) {
    return await new this.companyModel(dto).save();
  }

  public async update(id: string, company: Company) {
    await this.companyModel.updateOne({ _id: { $eq: id } }, company);
  }

  public async delete(id: string) {
    return await this.companyModel.deleteOne({ _id: { $eq: id } });
  }
}
