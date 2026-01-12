using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public abstract class KubernetesJobCommand<T> : JobCommand where T : JobRequest
{
    private IKubernetesFacade Kubernetes { get; }
    private JobEventsProducer EventsProducer { get; }
    private JobLogsProducer LogsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILogger Logger { get; }
    protected T Request { get; }

    protected abstract KubernetesJobTemplate JobTemplate { get; }

    protected KubernetesJobCommand(T request, IKubernetesFacade kubernetes, JobEventsProducer eventsProducer, JobLogsProducer jobLogsProducer, IFindingsParser parser, ILogger logger)
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
        LogsProducer.LogDebug(JobTemplate.Context, "Job picked up by orchestrator.");
        Logger.LogInformation(Request.JobId, "Job created, listening for events.");

        await EventsProducer.LogStatus(JobTemplate.Context, JobEventsProducer.JobStatus.Started);
    }
}