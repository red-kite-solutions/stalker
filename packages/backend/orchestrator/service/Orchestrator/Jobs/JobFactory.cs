using Orchestrator.Events;
using Orchestrator.Jobs.Commands;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;
using Orchestrator.Queue.JobsConsumer.JobRequests;
using System.Text.Json;

namespace Orchestrator.Jobs;

public class JobFactory : IJobFactory
{
    private IKubernetesFacade Kubernetes { get; }
    private IMessagesProducer<JobEventMessage> EventsProducer { get; }
    private IMessagesProducer<JobLogMessage> JobLogsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILoggerFactory LoggerFactory { get; }
    private ILogger<JobFactory> Logger { get; }
    private IConfiguration Config { get; }

    public JobFactory(IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILoggerFactory loggerFactoryFactory, IConfiguration config)
    {
        JobLogsProducer = jobLogsProducer;
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        Parser = parser;
        LoggerFactory = loggerFactoryFactory;
        Logger = loggerFactoryFactory.CreateLogger<JobFactory>();
        Config = config;
    }

    public JobCommand Create(JobRequest request)
    {
        Logger.LogInformation(JsonSerializer.Serialize(request));

        return request switch
        {
            CustomJobRequest customJob => CreateCustomJobCommand(customJob),
            _ => throw new InvalidOperationException(),
        };
    }

    private JobCommand CreateCustomJobCommand(CustomJobRequest request)
    {
        if (request.Type?.ToLower() == "code")
        {
            return request.Language?.ToLower() switch
            {
                "python" => new PythonCustomJobCommand(request, Kubernetes, EventsProducer, JobLogsProducer, Parser, LoggerFactory.CreateLogger<PythonCustomJobCommand>(), Config),
                _ => throw new InvalidOperationException(),
            };
        }

        if (request.Type?.ToLower() == "nuclei")
        {
            return new NucleiCustomJobCommand(request, Kubernetes, EventsProducer, JobLogsProducer, Parser, LoggerFactory.CreateLogger<NucleiCustomJobCommand>(), Config);
        }

        throw new InvalidOperationException();
    }
}