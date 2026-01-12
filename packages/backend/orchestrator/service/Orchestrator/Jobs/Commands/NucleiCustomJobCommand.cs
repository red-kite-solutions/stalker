using Orchestrator.Events;
using Orchestrator.Jobs.JobModelCache;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class NucleiCustomJobCommand : KubernetesJobCommand<CustomJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public NucleiCustomJobCommand(CustomJobRequest request, JobModel model, IKubernetesFacade kubernetes, JobEventsProducer eventsProducer, JobLogsProducer jobLogsProducer, IFindingsParser parser, ILogger<NucleiCustomJobCommand> logger, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger)
    {
        JobTemplate = new NucleiCustomJobTemplate(new JobContext(request.JobId!, request.ProjectId ?? ""), config, request.CustomJobParameters, model.Code, request.JobPodMilliCpuLimit, request.JobPodMemoryKbLimit, model.FindingHandler, model.Image);
    }
}