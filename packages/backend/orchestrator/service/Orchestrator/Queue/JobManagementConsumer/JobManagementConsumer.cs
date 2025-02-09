using Confluent.Kafka;
using k8s.Models;
using Orchestrator.Jobs;
using Orchestrator.K8s;
using Orchestrator.Queue.JobManagementConsumer;
using Orchestrator.Queue.JobModelsConsumer;
using YamlDotNet.Core.Tokens;
using YamlDotNet.Serialization;

namespace Orchestrator.Queue.JobsConsumer;

public class JobManagementConsumer : KafkaConsumer<JobManagementRequest>
{

    protected override string GroupId => "stalker";

    protected override string[] Topics => new[] { Constants.JobManagementTopic };
    private string? K8sNamespace = "";
    private IJobFactory JobFactory { get; }

    public JobManagementConsumer(IJobFactory jobFactory, IConfiguration config, ILogger<JobManagementConsumer> logger)
        : base(config, new JobManagementSerializer<JobManagementRequest>(), logger)
    {
        K8sNamespace = config.GetSection("Jobs").GetValue<string>("Namespace");
        JobFactory = jobFactory;
    }

    protected override CancellationToken SetupConsumer(ConsumerConfig consumerConfig, IDeserializer<JobManagementRequest> deserializer)
    {
        Consumer = new ConsumerBuilder<Ignore, JobManagementRequest>(consumerConfig)
                        .SetValueDeserializer(deserializer)
                        .Build();

        Logger.LogDebug($"Starting consumer. Subscribing to topics {string.Join(",", Topics)}");
        Consumer.Subscribe(Topics);

        foreach (var topic in Topics)
        {
            Consumer.Assign(new TopicPartitionOffset(new TopicPartition(topic, new Partition(0)), Offset.End));
        }

        TokenSource = new CancellationTokenSource();
        CancellationToken ct = TokenSource.Token;

        return ct;
    }

    protected override Task Consume(JobManagementRequest request)
    {
        

#pragma warning disable CS4014
        HandleRequest(request);
#pragma warning restore CS4014

        return Task.CompletedTask;
    }

    private async Task HandleRequest(JobManagementRequest request)
    {
        try
        {
            var jobCommand = JobFactory.Create(request);
            await jobCommand.Execute();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, $"An error occurred while handling job mangement request for job {request.JobId}.");
        }
    }
}