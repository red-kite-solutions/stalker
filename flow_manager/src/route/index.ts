import * as express from 'express';

export class Index {
    public router = express.Router();

    constructor() {
        this.router.get('/', this.index.bind(this));
    }

    private index(req: express.Request, res: express.Response) {
        res.json({
            version: process.env.VERSION
        });
    }
}
