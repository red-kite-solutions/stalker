using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public abstract class KubernetesCommand<T> : JobCommand where T : JobRequest
{
    private IKubernetesFacade Kubernetes { get; }
    private IMessagesProducer<JobEventMessage> EventsProducer { get; }
    private IMessagesProducer<JobLogMessage> LogsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILogger Logger { get; }
    protected T Request { get; }

    protected abstract KubernetesJobTemplate JobTemplate { get; }

    protected KubernetesCommand(T request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILogger logger)
    {
        Request = request;
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        LogsProducer = jobLogsProducer;
        Parser = parser;
        Logger = logger;
    }

    /// <summary>
    /// Waits for a scaling amount of time everytime you call it, according to the iteration parameter
    /// Does not wait for the first iteration
    /// During 10 seconds, wait for 100ms for every call (100i)
    /// During 20 seconds, wait for 200ms for every call (100i)
    /// During 30 seconds, wait for 300ms for every call (100i)
    /// During 4 minutes, wait for 1000ms for every call (240i)
    /// During 5 minutes, wait for 5000ms for every call (60i)
    /// During 20 minutes, wait for 20000ms for every call (60i)
    /// If the function is called more than 660 times total (660i), wait for 30000ms for every call
    /// </summary>
    private static void ScalingSleep(int iteration)
    {
        int waitTime;
        if (iteration == 0)
        {
            waitTime = 0;
        }
        else if (iteration <= 300)
        {
            waitTime = (iteration / 100) + 100;
        }
        else if (iteration > 300 && iteration <= 540)
        {
            waitTime = 1000;
        }
        else if (iteration > 540 && iteration <= 600)
        {
            waitTime = 5000;
        }
        else if (iteration > 600 && iteration <= 660)
        {
            waitTime = 20000;
        }
        else
        {
            waitTime = 30000;
        }
        Thread.Sleep(waitTime);
    }

    private long CurrentTimeMs()
    {
        DateTimeOffset dto = new DateTimeOffset(DateTime.Now.ToUniversalTime());
        return dto.ToUnixTimeMilliseconds();
    }

    public override async Task Execute()
    {
        Logger.LogInformation(Request.JobId, "Creating job.");

        var job = await Kubernetes.CreateJob(JobTemplate);
        await LogDebug("Job picked up by orchestrator.");
        Logger.LogInformation(Request.JobId, "Job created, listening for events.");

        await EventsProducer.Produce(new JobEventMessage
        {
            JobId = Request.JobId,
            FindingsJson = "{ \"findings\": [{ \"type\": \"JobStatusFinding\", \"status\": \"Started\" }]}",
            Timestamp = CurrentTimeMs(),
        });

        // Local functions
        async Task LogDebug(string message)
        {
            await LogsProducer.Produce(new JobLogMessage()
            {
                JobId = Request.JobId,
                Log = message,
                LogLevel = Events.LogLevel.Debug,
                Timestamp = CurrentTimeMs()
            });
        }
    }
}