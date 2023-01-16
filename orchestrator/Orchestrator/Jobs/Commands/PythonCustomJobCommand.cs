using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class PythonCustomJobCommand : KubernetesCommand<CustomJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public PythonCustomJobCommand(CustomJobRequest request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger<PythonCustomJobCommand> logger, PythonJobTemplateProvider jobProvider) : base(request, kubernetes, eventsProducer, parser, logger)
    {
        JobTemplate = new PythonCustomJobTemplate(request.JobId, "stalker-jobs", request.CustomJobParameters, request.Code);
    }
}