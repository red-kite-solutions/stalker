using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class HttpOrHttpServerCheckCommand : KubernetesCommand<HttpOrHttpsServerCheckJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public HttpOrHttpServerCheckCommand(HttpOrHttpsServerCheckJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger<TcpPortScanningCommand> logger, PythonJobTemplateProvider jobProvider) : base(request, kubernetes, eventsProducer, parser, logger)
    {
        JobTemplate = new HttpOrHttpsServerCheckJobTemplate(request.JobId, "stalker", request.TargetIp, request.Ports, jobProvider);
    }
}