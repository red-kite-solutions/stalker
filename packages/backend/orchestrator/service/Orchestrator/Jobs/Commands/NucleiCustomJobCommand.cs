using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class NucleiCustomJobCommand : KubernetesCommand<CustomJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public NucleiCustomJobCommand(CustomJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILogger<NucleiCustomJobCommand> logger, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger)
    {
        JobTemplate = new NucleiCustomJobTemplate(request.JobId, config, request.CustomJobParameters, request.Code, request.JobPodMilliCpuLimit, request.JobPodMemoryKbLimit, request.FindingHandler);
    }
}