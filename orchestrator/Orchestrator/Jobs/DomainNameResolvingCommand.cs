using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public class DomainNameResolvingCommand : KubernetesCommand<DomainNameResolvingJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public DomainNameResolvingCommand(DomainNameResolvingJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger<DomainNameResolvingCommand> logger) : base(request, kubernetes, eventsProducer, parser, logger)
    {
        JobTemplate = new DomainNameResolvingJobTemplate(request.JobId, "stalker", request.DomainName);
    }
}