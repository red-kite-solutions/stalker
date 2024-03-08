using Confluent.Kafka;
using k8s.Models;
using Orchestrator.Jobs;
using Orchestrator.Jobs.JobModelCache;
using Orchestrator.K8s;
using Orchestrator.Queue.JobsConsumer;
using static Confluent.Kafka.ConfigPropertyNames;

namespace Orchestrator.Queue.JobModelsConsumer
{
    public class JobModelsConsumer : KafkaConsumer<JobModelUpdateRequest>
    {
        protected override string[] Topics => new[] { Constants.JobModelsTopic };
        protected override string GroupId => "stalker";

        public JobModelsConsumer(IConfiguration config, ILogger<JobModelsConsumer> logger) 
            : base(config, new JobModelSerializer<JobModelUpdateRequest>(), logger, Confluent.Kafka.AutoOffsetReset.Earliest)
        {
        }

        protected override Task Consume(JobModelUpdateRequest request)
        {
            HandleRequest(request);

            return Task.CompletedTask;
        }

        protected override CancellationToken SetupConsumer(ConsumerConfig consumerConfig, IDeserializer<JobModelUpdateRequest> deserializer)
        {
            Consumer = new ConsumerBuilder<Ignore, JobModelUpdateRequest>(consumerConfig)
                            .SetValueDeserializer(deserializer)
                            .Build();

            Logger.LogDebug($"Starting consumer. Subscribing to topics {string.Join(",", Topics)}");
            Consumer.Subscribe(Topics);

            foreach (var topic in Topics)
            {
                Consumer.Assign(new TopicPartitionOffset(new TopicPartition(topic, new Partition(0)), Offset.Beginning));
            }

            TokenSource = new CancellationTokenSource();
            CancellationToken ct = TokenSource.Token;

            return ct;
        }

        private void HandleRequest(JobModelUpdateRequest request)
        {
            if (request.Id == null || request.Model == null) return;

            try
            {
                var jm = new JobModel
                {
                    Id = request.Id,
                    Name = request.Model.Name,
                    Code = request.Model.Code,
                    Type = request.Model.Type,
                    Language = request.Model.Language,
                    FindingHandler = request.Model.FindingHandler,
                    FindingHandlerLanguage = request.Model.FindingHandlerLanguage
                };
                JobModelCache.Add(request.Id, jm);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"An error occurred while handling job model update {request.Id}.");
            }
        }
    }
}