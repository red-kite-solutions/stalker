using k8s;
using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobManagementConsumer.JobManagementRequests;

namespace Orchestrator.Jobs.JobManagementCommand;

public class TerminateJobCommand : KubernetesManagementCommand<TerminateJobRequest>
{
    public TerminateJobCommand(TerminateJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, JobLogsProducer jobLogsProducer, IFindingsParser parser, ILogger<TerminateJobCommand> logger, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger, config)
    { }

    public override Task Execute()
    {
        Kubernetes.TerminateJob(Request.JobId, Namespace);
        return Task.CompletedTask;
    }
}