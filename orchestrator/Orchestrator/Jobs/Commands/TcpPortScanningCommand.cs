using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class TcpPortScanningCommand : KubernetesCommand<TcpPortScanningJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public TcpPortScanningCommand(TcpPortScanningJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger<TcpPortScanningCommand> logger, PythonJobTemplateProvider jobProvider) : base(request, kubernetes, eventsProducer, parser, logger)
    {
        JobTemplate = new TcpPortScanningJobTemplate(request.JobId, "stalker-jobs", request.TargetIp, request.Threads, request.SocketTimeoutSeconds, request.PortMin, request.PortMax, request.Ports, jobProvider);
    }
}