import * as express from 'express';
import { body, Result, ValidationError, validationResult } from 'express-validator';
import * as idGenerator from 'uuid';
import { JobsQueue } from '../services/jobs_queue.service';



export class Jobs {
    public router = express.Router();
    

    constructor() {
        this.router.post('/create', [
            body().notEmpty(),
            body('task').isString().notEmpty(),
            body('priority').isInt(),
            body('data').notEmpty()
        ], this.createJob.bind(this));

    }

    // POST /jobs/create
    private createJob(req: express.Request, res: express.Response) {
        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let id: String = idGenerator.v4();
        JobsQueue.add(id, req.body.task, req.body.priority, req.body.data);
        
        res.json({status : 'Job successfully queued.'});
    }

    
}