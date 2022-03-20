import { Injectable } from "@nestjs/common";
import { BaseService } from "src/services/base.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Config } from "./config.model";
import { SubmitConfigDto } from "./config.dto";
import { DEFAULT_CONFIG } from "./config.default";



@Injectable()
export class ConfigService extends BaseService<Config, Config> {
    
    public PASSWORD_PLACEHOLDER: string = "********";
    public config: Config;

    constructor(@InjectModel("config") private readonly configModel: Model<Config>) {
        super(configModel);
        this.findOne({}).then((c: Config) => {
            if (!c?.keybaseConfig) { // Check random config object to see if it was initialized
                c = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                this.upsertOne({}, c);
            }

            this.config = c;            
        });
    }

    public async submitConfig(configUpdate: SubmitConfigDto): Promise<void> {
        let conf: Partial<Config> = { };


        // Reporting
        if (configUpdate?.isNewContentReported || configUpdate?.isNewContentReported === false)
            conf.isNewContentReported = configUpdate?.isNewContentReported;

        // Keybase
        if ((configUpdate?.keybaseConfigChannelId || configUpdate?.keybaseConfigChannelId === "") || 
            (configUpdate?.keybaseConfigUsername || configUpdate?.keybaseConfigUsername === "") || 
            (configUpdate?.keybaseConfigPaperkey || configUpdate?.keybaseConfigPaperkey === "") || 
            (configUpdate?.keybaseConfigEnabled || configUpdate?.keybaseConfigEnabled === false)
        ) {
            conf.keybaseConfig = {};
            if (configUpdate?.keybaseConfigChannelId || configUpdate?.keybaseConfigChannelId === "")
                conf.keybaseConfig.channelId = configUpdate?.keybaseConfigChannelId;
            if (configUpdate?.keybaseConfigUsername || configUpdate?.keybaseConfigUsername === "")
                conf.keybaseConfig.username = configUpdate.keybaseConfigUsername;
            if (configUpdate?.keybaseConfigPaperkey || configUpdate?.keybaseConfigPaperkey === "")
                conf.keybaseConfig.paperkey = configUpdate.keybaseConfigPaperkey;
            if (configUpdate?.keybaseConfigEnabled || configUpdate?.keybaseConfigEnabled === false)
                conf.keybaseConfig.enabled = configUpdate?.keybaseConfigEnabled;
        }

        


        this.update({}, conf);
        this.syncConfig(conf);
    }

    private syncConfig(configUpdate: Partial<Config>): void {
        this.config.isNewContentReported = configUpdate?.isNewContentReported || configUpdate?.isNewContentReported === false ? configUpdate.isNewContentReported : this.config.isNewContentReported;
        if (configUpdate?.keybaseConfig) {
            this.config.keybaseConfig.channelId = configUpdate.keybaseConfig?.channelId || configUpdate.keybaseConfig?.channelId === "" ? configUpdate.keybaseConfig.channelId : this.config.keybaseConfig.channelId;
            this.config.keybaseConfig.username = configUpdate.keybaseConfig?.username || configUpdate.keybaseConfig?.username === "" ? configUpdate.keybaseConfig.username : this.config.keybaseConfig.username;
            this.config.keybaseConfig.paperkey = configUpdate.keybaseConfig?.paperkey || configUpdate.keybaseConfig?.paperkey === "" ? configUpdate.keybaseConfig.paperkey : this.config.keybaseConfig.paperkey;
            this.config.keybaseConfig.enabled = configUpdate.keybaseConfig?.enabled || configUpdate.keybaseConfig?.enabled === false ? configUpdate.keybaseConfig.enabled : this.config.keybaseConfig.enabled;
        }
         
    }

    public async getConfig(): Promise<Config> {
        let conf: Config = JSON.parse(JSON.stringify(this.config));

        if (conf.keybaseConfig?.paperkey) {
            conf.keybaseConfig.paperkey = this.PASSWORD_PLACEHOLDER;
        }

        return conf;
    }
}