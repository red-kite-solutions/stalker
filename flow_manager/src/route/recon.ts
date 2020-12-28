import * as express from 'express';
import { body, Result, ValidationError, validationResult } from 'express-validator';
import * as validateUuid from 'uuid-validate';


export class Recon {
    public router = express.Router();
    

    constructor() {
        this.router.post('/subdomains/:id/results', [
            body().isArray().notEmpty(),
            body('*').isString().notEmpty()
        ], this.subdomainJobResults.bind(this));

    }

    // POST /subdomains/:id/results
    private subdomainJobResults(req: express.Request, res: express.Response) {
        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if(!validateUuid(req.params.id)) {
            res.json({ "err" : "ID must be a valid uuid."});
            return;
        }
        
        let domains: Array<String> = req.body;
        
        res.json(domains);
    }

    
}