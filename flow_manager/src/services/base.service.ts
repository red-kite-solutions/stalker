import { HttpException, HttpStatus } from "@nestjs/common";
import { MongoError } from "mongodb";
import { Document, DocumentDefinition, Model } from "mongoose";

export class BaseService<T extends Document, Dto> {
    constructor(protected readonly model: Model<T>) {
    }

    async create(object: Partial<T>): Promise<T> {
        const instance = new this.model(<T>object);
        try {
            return instance.save();
        } catch (e) {
            console.log(e);
            // Catch mongo errors like required, unique, min, max, etc...
            if (e instanceof MongoError) {
                throw new HttpException({
                    message: e.message,
                    code: e.code
                }, HttpStatus.PRECONDITION_FAILED);
            } else {
                throw e;
            }
        }
    }

    async findAll(): Promise<T[]> {
        return this.model.find().lean().exec();
    }

    async findAllFilter(filter: any): Promise<T[]> {
        return this.model.find({}, filter).exec();
    }

    async find(conditions: any): Promise<T[]> {
        return this.model.find(conditions).exec();
    }

    async findOne(condition: any): Promise<T> {
        return this.model.findOne(condition).lean().exec();
    }

    async findOneFilter(condition: any, filter: any): Promise<T> {
        return this.model.findOne(condition, filter).exec();
    }

    async findById(id: Object | string | number): Promise<T> {
        return this.model.findById(id).exec();
    }

    async update(condition: any, data: Partial<T>): Promise<any> {
        return this.model.updateOne(condition, data).exec();
    }

    async updateOneFilter(condition: any, dataFilter: any, data: Partial<T>): Promise<any> {
        return this.model.updateOne(condition, data, dataFilter);
    }

    async updateMany(condition: any, data: Partial<T>): Promise<any> {
        return this.model.updateMany(condition, data).exec();
    }

    async upsertOne(condition: any, data: Partial<T>) {
        return this.model.updateOne(condition, data, { "upsert": true});
    }

    async remove(condition: any): Promise<void> {
        await this.model.deleteOne(condition).exec();
    }

    // async aggregate(condition: any): Promise<T> {
    //     return this.model.aggregate(condition).exec();
    // }
}