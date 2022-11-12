using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobsConsumer;
using System.Text.Json;

namespace Orchestrator.Jobs;

public class JobFactory : IJobFactory
{
    private IKubernetesFacade Kubernetes { get; }
    private IMessagesProducer<JobEventMessage> EventsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILoggerFactory LoggerFactory { get; }
    private ILogger<JobFactory> Logger { get; }
    private JobTemplateProvider JobProvider { get; }

    public JobFactory(IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILoggerFactory loggerFactoryFactory)
    {
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        Parser = parser;
        LoggerFactory = loggerFactoryFactory;
        Logger = loggerFactoryFactory.CreateLogger<JobFactory>();

        string? pythonJobTemplatePath = System.Environment.GetEnvironmentVariable("ORCHESTRATOR_PYTHON_JOB_TEMPLATES_PATH");
        if (pythonJobTemplatePath == null) throw new NullReferenceException("Environment variable ORCHESTRATOR_PYTHON_JOB_TEMPLATES_PATH was not declared.");

        JobProvider = new JobTemplateProvider(LoggerFactory.CreateLogger<JobTemplateProvider>(), pythonJobTemplatePath);
    }

    public JobCommand Create(JobRequest request)
    {
        Logger.LogDebug(JsonSerializer.Serialize(request));

        return request switch
        {
            DomainNameResolvingJobRequest domainResolving => new DomainNameResolvingCommand(domainResolving, Kubernetes, EventsProducer, Parser, LoggerFactory.CreateLogger<DomainNameResolvingCommand>(), JobProvider),
            _ => null,
        } ?? throw new InvalidOperationException();
    }
}