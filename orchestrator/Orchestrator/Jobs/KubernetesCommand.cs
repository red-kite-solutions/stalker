﻿using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public abstract class KubernetesCommand<T> : JobCommand where T : JobRequest
{
    private IKubernetesFacade Kubernetes { get; }
    private IMessagesProducer<JobEventMessage> EventsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILogger Logger { get; }
    protected T Request { get; }

    protected abstract KubernetesJobTemplate JobTemplate { get; }

    protected KubernetesCommand(T request, IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILogger logger)
    {
        Request = request;
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        Parser = parser;
        Logger = logger;
    }

    public override async Task Execute()
    {
        Logger.LogDebug(Request.JobId, "Creating job.");

        var job = await Kubernetes.CreateJob(JobTemplate);

        Logger.LogDebug(Request.JobId, "Job created, listening for events.");
        var logs = await Kubernetes.GetJobLogs(job.Name, job.Namespace);

        var streamReader = new StreamReader(logs);
        while (!streamReader.EndOfStream)
        {
            var line = await streamReader.ReadLineAsync();

            var evt = Parser.Parse(line);
            if (evt == null) continue;

            await EventsProducer.Produce(new JobEventMessage
            {
                JobId = Request.JobId,
                FindingsJson = evt.FindingsJson,
            });
        }

        await Kubernetes.DeleteJob(job.Name, job.Namespace);
    }

}