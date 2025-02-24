import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Table, TableDocument } from './tables.model';

@Injectable()
export class TableService {
  private logger = new Logger(TableService.name);

  constructor(
    @InjectModel('table')
    private readonly tableModel: Model<Table>,
  ) {}

  public async getAll(): Promise<
    Pick<TableDocument, 'name' | 'icon' | 'isPinned' | '_id'>[]
  > {
    return await this.tableModel.find({}, '_id name icon isPinned');
  }

  public async getTable(id: string) {
    return await this.tableModel.findById(id);
  }

  public async createTable(table: Table) {
    return await this.tableModel.create(table);
  }

  public async updateTable(id: string, table: Table) {
    return await this.tableModel.findOneAndUpdate(
      { _id: { $eq: new Types.ObjectId(id) } },
      table,
      { new: true },
    );
  }

  public async deleteTable(id: string) {
    return await this.tableModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }
}
