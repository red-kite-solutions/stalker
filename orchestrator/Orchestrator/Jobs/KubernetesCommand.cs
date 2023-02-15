using Microsoft.AspNetCore.Components.Web;
using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;
using System;

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

    /// <summary>
    /// Waits for a scaling amount of time everytime you call it, according to the iteration parameter
    /// Does not wait for the first iteration
    /// During 10 seconds, wait for 100ms for every call (100i)
    /// During 20 seconds, wait for 200ms for every call (100i)
    /// During 30 seconds, wait for 300ms for every call (100i)
    /// During 4 minutes, wait for 1000ms for every call (240i)
    /// During 5 minutes, wait for 5000ms for every call (60i)
    /// During 20 minutes, wait for 20000ms for every call (60i)
    /// If the function is called more than 660 times total (660i), wait for 30000ms for every call
    /// </summary>
    private static void ScalingSleep(int iteration)
    {
        int waitTime;
        if (iteration == 0)
        {
            waitTime = 0;
        }
        else if (iteration <= 300)
        {
            waitTime = (iteration / 100) + 100;
        }
        else if (iteration > 300 && iteration <= 540)
        {
            waitTime = 1000;
        }
        else if (iteration > 540 && iteration <= 600)
        {
            waitTime = 5000;
        }
        else if (iteration > 600 && iteration <= 660)
        {
            waitTime = 20000;
        }
        else
        {
            waitTime = 30000;
        }
        Thread.Sleep(waitTime);
    }

    private long CurrentTimeMs()
    {
        DateTimeOffset dto = new DateTimeOffset(DateTime.Now.ToUniversalTime());
        return dto.ToUnixTimeMilliseconds();
    }

    public override async Task Execute()
    {
        Logger.LogDebug(Request.JobId, "Creating job.");

        var job = await Kubernetes.CreateJob(JobTemplate);

        // Publishing that the job started
        await EventsProducer.Produce(new JobEventMessage
        {
            JobId = Request.JobId,
            FindingsJson = "{ \"findings\": [{ \"type\": \"JobStatusFinding\", \"status\": \"Started\" }]}",
            Timestamp = CurrentTimeMs(),
        });

        Logger.LogDebug(Request.JobId, "Job created, listening for events.");

        int i = 0;
        do
        {
            ScalingSleep(i);
            ++i;

        } while (!await Kubernetes.IsJobPodFinished(job.Name, job.Namespace));

        var logs = await Kubernetes.GetJobLogs(job.Name, job.Namespace);

        var streamReader = new StreamReader(logs);
        while (!streamReader.EndOfStream)
        {
            var line = await streamReader.ReadLineAsync();

            var evt = Parser.Parse(line);
            if (evt == null) continue;

            var evtType = evt.GetType().UnderlyingSystemType;

            if (evtType == typeof(LogEventModel))
            {
                var logEvt = (LogEventModel)evt;
                switch (logEvt.LogType)
                {
                    case LogType.Debug:
                        Logger.LogDebug(logEvt.data);
                        continue;
                    default:
                        continue;
                }
            }

            if (evtType == typeof(FindingsEventModel))
            {
                await EventsProducer.Produce(new JobEventMessage
                {
                    JobId = Request.JobId,
                    FindingsJson = evt.data,
                    Timestamp = CurrentTimeMs()
                });
            }
        }

        // When we are done publishing findings, we publish that the job is done
        await EventsProducer.Produce(new JobEventMessage
        {
            JobId = Request.JobId,
            FindingsJson = "{ \"findings\": [{ \"type\": \"JobStatusFinding\", \"status\": \"Success\" }]}",
            Timestamp = CurrentTimeMs(),
        });

        await Kubernetes.DeleteJob(job.Name, job.Namespace);
    }
}