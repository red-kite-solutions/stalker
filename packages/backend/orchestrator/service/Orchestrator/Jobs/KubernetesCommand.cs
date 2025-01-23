using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public abstract class KubernetesCommand<T> : JobCommand where T : JobRequest
{
    private IKubernetesFacade Kubernetes { get; }
    private IMessagesProducer<JobEventMessage> EventsProducer { get; }
    private JobLogsProducer LogsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILogger Logger { get; }
    protected T Request { get; }

    protected abstract KubernetesJobTemplate JobTemplate { get; }

    protected KubernetesCommand(T request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, JobLogsProducer jobLogsProducer, IFindingsParser parser, ILogger logger)
    {
        Request = request;
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        LogsProducer = jobLogsProducer;
        Parser = parser;
        Logger = logger;
    }

    public override async Task Execute()
    {
        Logger.LogInformation(Request.JobId, "Creating job.");

        var job = await Kubernetes.CreateJob(JobTemplate);
        LogsProducer.LogDebug(Request.JobId, "Job picked up by orchestrator.");
        Logger.LogInformation(Request.JobId, "Job created, listening for events.");

        await EventsProducer.Produce(new JobEventMessage
        {
            JobId = Request.JobId,
            FindingsJson = "{ \"findings\": [{ \"type\": \"JobStatusFinding\", \"status\": \"Started\" }]}",
            Timestamp = TimeUtils.CurrentTimeMs(),
        });
    }
}