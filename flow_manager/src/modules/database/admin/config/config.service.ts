import { Injectable } from "@nestjs/common";
import { BaseService } from "src/services/base.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Config } from "./config.model";
import { SubmitConfigDto } from "./config.dto";



@Injectable()
export class ConfigService extends BaseService<Config, Config> {

    public config: Config;

    constructor(@InjectModel("config") private readonly configModel: Model<Config>) {
        super(configModel);
        this.findOne({}).then((c: Config) => {
            if (!c) {
                c = new Config();
            }
            if (!(c.IsNewContentReported || c.IsNewContentReported === false)) {
                c.IsNewContentReported = false;
            }

            this.config = c;
            this.upsertOne({}, c);
        });
    }

    public async submitConfig(dto: SubmitConfigDto): Promise<void> {
        this.update({}, dto);
        this.syncConfig(dto);
    }

    private syncConfig(configUpdate: Partial<Config>): void {
        this.config.IsNewContentReported = configUpdate.IsNewContentReported || configUpdate.IsNewContentReported === false ? configUpdate.IsNewContentReported : false;
    }    
}