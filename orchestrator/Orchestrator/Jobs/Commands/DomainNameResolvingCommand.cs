using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class DomainNameResolvingCommand : KubernetesCommand<DomainNameResolvingJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public DomainNameResolvingCommand(DomainNameResolvingJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILogger<DomainNameResolvingCommand> logger, PythonJobTemplateProvider jobProvider, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger)
    {
        JobTemplate = new DomainNameResolvingJobTemplate(request.JobId, config, request.DomainName, jobProvider);
    }
}