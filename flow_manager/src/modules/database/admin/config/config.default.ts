import { Config } from "./config.model"

export const DEFAULT_CONFIG: Config = {
    isNewContentReported: false,

    keybaseConfig : {
        enabled: false,
        username: "",
        paperkey: "",
        channelId: ""
    }
}