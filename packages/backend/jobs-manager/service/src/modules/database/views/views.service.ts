import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { View, ViewDocument } from './views.model';

@Injectable()
export class ViewService {
  private logger = new Logger(ViewService.name);

  constructor(
    @InjectModel('view')
    private readonly viewModel: Model<View>,
  ) {}

  public async getAll(): Promise<
    Pick<ViewDocument, 'name' | 'icon' | 'isPinned' | '_id'>[]
  > {
    return await this.viewModel.find({}, '_id name icon isPinned');
  }

  public async getView(id: string) {
    return await this.viewModel.findById(id);
  }

  public async createView(view: View) {
    return await this.viewModel.create(view);
  }

  public async updateView(id: string, view: View) {
    return await this.viewModel.findOneAndUpdate(
      { _id: { $eq: new Types.ObjectId(id) } },
      view,
      { new: true },
    );
  }

  public async deleteView(id: string) {
    return await this.viewModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }
}
