# Jobs Queue Handler (JQH)

A python job priority queue API based on Flask. 

Default port: 5000

## Job Priority

The job priority is given on a FIFO basis as well as with a int priority parameter in the JSON objects. All priority 1 jobs will be done before priority 2 jobs, and the Flow Manager sets a priority 3 job as a standard priority. 

If you want a job to be done right away, and the queue contains a lot of jobs coming from the Flow Manager, then you might want to consider to give your job the priority 2 or 1 to be executed before the other ones. 

If you want a job to be done whenever the Jobs Handlers have nothing to do, then giving your job the priority 4 or 5 makes sense. 

If you want your job to be done respecting the standard FIFO order, then you probably want to give it the priority 3. 

## Jobs

A job consists of a task to do for the Job Handlers. They can be to find subdomains, to take a screenshot of a website, to try a check of a vulnerability, anything really.  

All jobs have the following fields:

|Field Name|Description|
|----------|-----------|
|id|A string uuid. It is used to reference the job in the database in the Flow Manager. It is simply passed along with the job.|
|priority|An integer, usually between 1 and 5. Used to prioritize jobs, 1 being the higher priority.|
|task|A string of the name of the task, simply past along with the job. The Job Handler uses the task name to determine what he has to do and what should be contained in the data object.|
|data|A JSON object, simply past along with the job. It contains the necessary information for the completion of the job in the Job Handlers|


## Requests

All requests on the Job Queue Handler must be authenticated using the API_KEY HTTP header. The value is given to the JQH through an environment variable.

### Create a new job

Creates a new job to add to the queue. The job will be sorted according to the given, priority. A smaller priority value (ex: 1 < 3) will be put in front of bigger priority values. Otherwise, they are sorted on a FIFO basis. The data contained will change drastically between task, and therefore task names.

> **_NOTE:_** Creating a job in the Jobs Queue Handler manually should be done only for testing purposes as the Flow Manager will not be aware of it

`POST /job`

```
{ 
    "task":"my task name here",
    "id":"uuid of the job in the flow manager",
    "priority":3,
    "data": {}
}
```

### Get a job from the queue

Getting the next job in the queue. Getting a job removes it from the queue as it is poped. This is usually called by Job Handlers.

`GET /job`


### Get all jobs

Gets the list of all the jobs in the queue. This does not delete the jobs currently in the queue and is simply available for monitoring or debugging purposes. 

`GET /jobs`

