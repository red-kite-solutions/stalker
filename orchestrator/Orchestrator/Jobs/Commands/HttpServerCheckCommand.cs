using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class HttpServerCheckCommand : KubernetesCommand<HttpServerCheckJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public HttpServerCheckCommand(HttpServerCheckJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILogger<TcpPortScanningCommand> logger, PythonJobTemplateProvider jobProvider, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger)
    {
        JobTemplate = new HttpServerCheckJobTemplate(request.JobId, config, request.TargetIp, request.Ports, jobProvider);
    }
}