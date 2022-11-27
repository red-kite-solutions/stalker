using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class DomainNameResolvingCommand : KubernetesCommand<DomainNameResolvingJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public DomainNameResolvingCommand(DomainNameResolvingJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger<DomainNameResolvingCommand> logger, PythonJobTemplateProvider jobProvider) : base(request, kubernetes, eventsProducer, parser, logger)
    {
        JobTemplate = new DomainNameResolvingJobTemplate(request.JobId, "stalker", request.DomainName, jobProvider);
    }
}