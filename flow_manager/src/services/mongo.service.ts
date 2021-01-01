import * as mongoose from 'mongoose';

export class MongoService {
    private static instance: MongoService;
    public db: mongoose.Connection;

    private constructor() {
        let mongoDB = 'mongodb://127.0.0.1:27017/recon_automation';
        mongoose.connect(mongoDB, {useNewUrlParser: true});
        this.db = mongoose.connection;
        this.db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    }

    public static getInstance(): MongoService {
        if(!this.instance) {
            this.instance = new MongoService();
        }
        return this.instance;
    }
}