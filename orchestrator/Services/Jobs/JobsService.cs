using Orchestrator.Services.Events;
using Orchestrator.Services.Jobs.JobTemplates;
using Orchestrator.Services.K8s;
using Orchestrator.Services.MessageQueue;

namespace Orchestrator.Services.Jobs;

public class JobsService : IJobsService
{
    private readonly IKubernetesFacade Kubernetes;
    private readonly IMessagesProducer<JobEventMessage> EventsProducer;
    private readonly IFindingsParser Parser;
    private readonly ILogger<JobsService> Logger;

    public JobsService(IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger<JobsService> logger)
    {
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        Parser = parser;
        Logger = logger;
    }

    public async Task<JobStartedModel> Start(JobModel jobModel)
    {
        Logger.LogDebug(jobModel.Id, "Creating job.");

        var jobTemplate = new HostnameIpResolvingJobTemplate("stalker", "www.google.com");
        var job = await Kubernetes.CreateJob(jobTemplate);

        Logger.LogDebug(jobModel.Id, "Job created, listening for events.");
        var logs = await Kubernetes.GetJobLogs(job.Name, job.Namespace);

        var streamReader = new StreamReader(logs);
        while (!streamReader.EndOfStream)
        {
            var line = await streamReader.ReadLineAsync();

            var evt = Parser.Parse(line);
            if (evt == null) continue;

            await EventsProducer.Produce(new JobEventMessage
            {
                JobId = jobModel.Id,
                FindingsJson = evt.FindingsJson,
            });
        }

        await Kubernetes.DeleteJob(job.Name, job.Namespace);

        return new JobStartedModel();
    }
}