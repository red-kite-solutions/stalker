using Microsoft.AspNetCore.Components.Web;
using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public abstract class KubernetesCommand<T> : JobCommand where T : JobRequest
{
    private IKubernetesFacade Kubernetes { get; }
    private IMessagesProducer<JobEventMessage> EventsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILogger Logger { get; }
    protected T Request { get; }

    protected abstract KubernetesJobTemplate JobTemplate { get; }

    protected KubernetesCommand(T request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger logger)
    {
        Request = request;
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        Parser = parser;
        Logger = logger;
    }

    public override async Task Execute()
    {
        Logger.LogDebug(Request.JobId, "Creating job.");

        var job = await Kubernetes.CreateJob(JobTemplate);

        Logger.LogDebug(Request.JobId, "Job created, listening for events.");

        bool sleep = false;
        do
        {
            if (sleep)
                Thread.Sleep(50);
            else
                sleep = true;

        } while (!await Kubernetes.IsJobPodFinished(job.Name, job.Namespace));

        var logs = await Kubernetes.GetJobLogs(job.Name, job.Namespace);

        var streamReader = new StreamReader(logs);
        while (!streamReader.EndOfStream)
        {
            var line = await streamReader.ReadLineAsync();

            var evt = Parser.Parse(line);
            if (evt == null) continue;

            var evtType = evt.GetType().UnderlyingSystemType;

            if (evtType == typeof(LogEventModel))
            {
                var logEvt = (LogEventModel)evt;
                switch (logEvt.LogType)
                {
                    case LogType.Debug:
                        Logger.LogDebug(logEvt.data);
                        continue;
                    default:
                        continue;
                }
            }

            if (evtType == typeof(FindingsEventModel))
            {
                await EventsProducer.Produce(new JobEventMessage
                {
                    JobId = Request.JobId,
                    FindingsJson = evt.data,
                });
            }
        }

        await Kubernetes.DeleteJob(job.Name, job.Namespace);
    }

}