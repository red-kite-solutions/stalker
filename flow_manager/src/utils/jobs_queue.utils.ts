import * as fetch from 'node-fetch';


export class JobsQueueUtils {
    public static async add(id: String, task: String, priority: Number, data: Object) {
        
        // add job to the database so that we remember what we sent
        
        // send job to the queue server
        let body = { id: id, task: task, priority: priority, data: data};
        let response = await fetch('http://localhost:5000/job', {
            method: 'POST', 
            body: JSON.stringify(body), 
            headers: {
                'Content-Type': 'application/json', 
                'API_KEY': process.env.JQH_API_KEY
            }
        });

        return response.ok;
    }
}