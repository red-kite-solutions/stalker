using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class PythonCustomJobCommand : KubernetesCommand<CustomJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public PythonCustomJobCommand(CustomJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILogger<PythonCustomJobCommand> logger, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger)
    {
        JobTemplate = new PythonCustomJobTemplate(request.JobId, config, request.CustomJobParameters, request.Code, request.JobPodMilliCpuLimit, request.JobPodMemoryKbLimit);
    }
}