using k8s;
using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobManagementConsumer.JobManagementRequests;

namespace Orchestrator.Jobs.JobManagementCommand;

public class TerminateJobCommand : KubernetesManagementCommand<TerminateJobRequest>
{
    public TerminateJobCommand(TerminateJobRequest request, IKubernetesFacade kubernetes, JobEventsProducer eventsProducer, JobLogsProducer jobLogsProducer, IFindingsParser parser, ILogger<TerminateJobCommand> logger, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger, config)
    { }

    public async override Task Execute()
    {
        bool terminationSuccess = await Kubernetes.TerminateJob(Request.JobId, Namespace);
        if (terminationSuccess)
        {
            LogsProducer.LogDebug(Request.JobId, $"Job terminated");
        } 
        else
        {
            LogsProducer.LogDebug(Request.JobId, "Tried to terminate, but no corresponding job was runnning");
        }
        _ = EventsProducer.LogStatus(Request.JobId, JobEventsProducer.JobStatus.Ended);
    }
}