﻿using Confluent.Kafka;

namespace Orchestrator.Queue
{
    public abstract class KafkaConsumer<T> : IDisposable
    {
        protected readonly ILogger<KafkaConsumer<T>> Logger;

        public KafkaConsumer(IConfiguration config, IDeserializer<T> deserializer, ILogger<KafkaConsumer<T>> logger)
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
                .SetValueDeserializer(deserializer)
                .Build();

            Logger.LogDebug($"Starting consumer. Subscribing to topics {string.Join(",", Topics)}");
            Consumer.Subscribe(Topics);

            TokenSource = new CancellationTokenSource();
            CancellationToken ct = TokenSource.Token;

            Logger.LogDebug("Starting consumer.");

            // Fire and forget
            Task.Run(async () =>
            {
                while (true)
                {

                    ct.ThrowIfCancellationRequested();

                    try
                    {
                        var message = Consumer.Consume();

                        if (message.Message != null && message.Message.Value != null)
                        {
                            Logger.LogDebug("There is a message on the queue!");
                            try
                            {
                                await Consume(message.Message.Value);
                            }
                            catch (k8s.Autorest.HttpOperationException ex)
                            {
                                Logger.LogError(ex.Message, ex.Request.Content, ex.Response.Content);
                            }
                        }
                        else
                        {
                            Logger.LogDebug("Nothing on the queue for now...");
                        }
                    }
                    catch (Exception ex)
                    {
                        Logger.LogError(ex, "An error occurred while deserializing the message.");
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
