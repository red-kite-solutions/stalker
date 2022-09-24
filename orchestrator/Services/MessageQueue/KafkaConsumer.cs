using Confluent.Kafka;

namespace Orchestrator.Services.MessageQueue
{
    public abstract class KafkaConsumer<T> : IDisposable
    {
        protected readonly ILogger<KafkaConsumer<T>> Logger;

        public KafkaConsumer(IConfiguration config, ILogger<KafkaConsumer<T>> logger)
        {
            var kafkaUri = config.GetSection("JobsQueue").GetValue<string>("QueueUri");
            Logger = logger;
            ConsumerConfig = new ConsumerConfig
            {
                BootstrapServers = kafkaUri,
                GroupId = GroupId,
                AllowAutoCreateTopics = true,
                AutoOffsetReset = AutoOffsetReset.Earliest
            };

            Consumer = new ConsumerBuilder<Ignore, T>(ConsumerConfig)
                .SetValueDeserializer(new JsonSerializer<T>())
                .Build();

            Consumer.Subscribe(Topics);

            TokenSource = new CancellationTokenSource();
            CancellationToken ct = TokenSource.Token;

            // Fire and forget
            Task.Run(async () =>
           {
               while (true)
               {
                   ct.ThrowIfCancellationRequested();

                   var message = Consumer.Consume();
                   if (message.Message != null && message.Message.Value != null)
                   {
                       try
                       {
                           await Consume(message.Message.Value);
                       }
                       catch (k8s.Autorest.HttpOperationException ex)
                       {
                           Logger.LogError(ex.Message, ex.Request.Content, ex.Response.Content);
                       }
                   }

                   await Task.Delay(5);
               }
           }, TokenSource.Token);
        }

        protected abstract string GroupId { get; }

        protected abstract string[] Topics { get; }

        private CancellationTokenSource TokenSource { get; set; }

        private ConsumerConfig ConsumerConfig { get; }

        private IConsumer<Ignore, T> Consumer { get; }

        protected abstract Task Consume(T message);

        public void Dispose()
        {
            Consumer.Dispose();
        }
    }
}
