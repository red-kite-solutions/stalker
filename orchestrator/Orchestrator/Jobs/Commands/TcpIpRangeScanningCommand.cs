using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class TcpIpRangeScanningCommand : KubernetesCommand<TcpIpRangeScanningJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public TcpIpRangeScanningCommand(TcpIpRangeScanningJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILogger<TcpIpRangeScanningCommand> logger, PythonJobTemplateProvider jobProvider, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger)
    {
        JobTemplate = new TcpIpRangeScanningJobTemplate(request.JobId, config, request.TargetIpRange, request.Rate, request.PortMin, request.PortMax, request.Ports, jobProvider);
    }
}
