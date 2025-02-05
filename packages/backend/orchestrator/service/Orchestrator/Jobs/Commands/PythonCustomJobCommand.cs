﻿using Orchestrator.Events;
using Orchestrator.Jobs.JobModelCache;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.Commands;

public class PythonCustomJobCommand : KubernetesCommand<CustomJobRequest>
{
    protected override KubernetesJobTemplate JobTemplate { get; }

    public PythonCustomJobCommand(CustomJobRequest request, JobModel model, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, JobLogsProducer jobLogsProducer, IFindingsParser parser, ILogger<PythonCustomJobCommand> logger, IConfiguration config)
        : base(request, kubernetes, eventsProducer, jobLogsProducer, parser, logger)
    {
        JobTemplate = new PythonCustomJobTemplate(request.JobId, config, request.CustomJobParameters, model.Code, request.JobPodMilliCpuLimit, request.JobPodMemoryKbLimit, model.Image);
    }
}