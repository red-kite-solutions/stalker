import * as express from 'express';
import * as path from 'path';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as mongoose from 'mongoose';
import { Index } from './route/index';
import { Recon } from './route/recon';
import { Jobs } from './route/jobs';

export class Application {

    public app: express.Application;

    public static bootstrap(): Application {
        return new Application();
    }

    constructor() {
        this.app = express();

        this.config();

        this.middlewares();

        this.routes();

        this.connectToDatabase();
    }

    private config() {
        this.app.use(logger('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use(cors());
    }

    public routes() {
        const index: Index = new Index();
        const recon: Recon = new Recon();
        const jobs: Jobs = new Jobs();
        
        this.app.use("/", index.router);
        this.app.use("/recon/", recon.router);
        this.app.use("/jobs/", jobs.router);

        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            let err = new Error('Not Found');
            next(err);
        });

        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            res.status(err.status || 404);
            res.send({
                message: err.message,
                error: {}
            });
        });
    }

    public middlewares() {
        
    }

    public connectToDatabase() {
        let connectionString = 'mongodb://127.0.0.1:27017/recon_automation';
        mongoose.connect(connectionString, {useNewUrlParser: true});
        let connection = mongoose.connection;
        connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
    }
}
