using Confluent.Kafka;
using Orchestrator.Events;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobManagementConsumer;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public abstract class KubernetesManagementCommand<T> : JobCommand where T : JobManagementRequest
{
    protected IKubernetesFacade Kubernetes { get; }
    protected JobEventsProducer EventsProducer { get; }
    protected JobLogsProducer LogsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILogger Logger { get; }
    protected T Request { get; }
    public string Namespace { get; set; } = "default";
    protected IConfiguration Config { get; init; }

    protected KubernetesManagementCommand(T request, IKubernetesFacade kubernetes, JobEventsProducer eventsProducer, JobLogsProducer jobLogsProducer, IFindingsParser parser, ILogger logger, IConfiguration config)
    {
        Request = request;
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer;
        LogsProducer = jobLogsProducer;
        Parser = parser;
        Logger = logger;
        Config = config;
        SetNamespace();
    }

    private void SetNamespace()
    {
        string? k8sNamespace = Config.GetSection("Jobs").GetValue<string>("Namespace");
        if (k8sNamespace == null) throw new NullReferenceException("Setting Jobs Namespace is missing.");
        Namespace = k8sNamespace;
    }
}