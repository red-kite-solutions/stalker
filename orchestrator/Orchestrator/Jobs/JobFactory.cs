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
    private IFindingsParser Parser { get; }
    private ILoggerFactory LoggerFactory { get; }
    private ILogger<JobFactory> Logger { get; }
    private PythonJobTemplateProvider JobProvider { get; }

    public JobFactory(IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IFindingsParser parser, ILoggerFactory loggerFactoryFactory, IConfiguration config)
    {
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        Parser = parser;
        LoggerFactory = loggerFactoryFactory;
        Logger = loggerFactoryFactory.CreateLogger<JobFactory>();

        string? pythonJobTemplatePath = config.GetSection("JobsProvider").GetValue<string>("PythonTemplatesPath");
        if (pythonJobTemplatePath == null) throw new NullReferenceException("Setting PythonTemplatesPath is missing.");

        JobProvider = new PythonJobTemplateProvider(LoggerFactory.CreateLogger<PythonJobTemplateProvider>(), pythonJobTemplatePath);
    }

    public JobCommand Create(JobRequest request)
    {
        Logger.LogDebug(JsonSerializer.Serialize(request));

        return request switch
        {
            DomainNameResolvingJobRequest domainResolving => new DomainNameResolvingCommand(domainResolving, Kubernetes, EventsProducer, Parser, LoggerFactory.CreateLogger<DomainNameResolvingCommand>(), JobProvider),
            TcpPortScanningJobRequest tcpPortScanning => new TcpPortScanningCommand(tcpPortScanning, Kubernetes, EventsProducer, Parser, LoggerFactory.CreateLogger<TcpPortScanningCommand>(), JobProvider),
            _ => throw new InvalidOperationException(),
        };
    }
}