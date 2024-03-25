using Confluent.Kafka;
using k8s.Models;
using Orchestrator.K8s;

namespace Orchestrator.Queue
{
    public abstract class KafkaConsumer<T> : IDisposable
    {
        protected readonly ILogger<KafkaConsumer<T>> Logger;

        public KafkaConsumer(IConfiguration config, IDeserializer<T> deserializer, ILogger<KafkaConsumer<T>> logger, AutoOffsetReset autoOffsetReset = AutoOffsetReset.Latest)
        {
            var kafkaUri = config.GetSection("JobsQueue").GetValue<string>("QueueUri");
            Logger = logger;
            ConsumerConfig = new ConsumerConfig
            {
                BootstrapServers = kafkaUri,
                GroupId = GroupId,
                AllowAutoCreateTopics = true,
                AutoOffsetReset = autoOffsetReset,
                SslCaLocation = "/certs/kafka-ca.crt",
                SslCertificateLocation = "/certs/kafka-client-signed.crt",
                SslKeyLocation = "/certs/kafka-client.key",
                SslKeyPassword = Environment.GetEnvironmentVariable("ORCHESTRATOR_KAFKA_KEY_PASSWORD"),
                SecurityProtocol = SecurityProtocol.Ssl,
            };

            CancellationToken ct = SetupConsumer(ConsumerConfig, deserializer);

            Logger.LogInformation("Starting consumer.");

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
                            Logger.LogInformation("There is a message on the queue!");
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
                            Logger.LogInformation("Nothing on the queue for now...");
                        }
                    }
                    catch (BadImageFormatException ex)
                    {
                        Logger.LogError(ex, "An error occurred while deserializing the message.");
                        Logger.LogInformation("Time between Consume() calls is likely too high. Recreating Consumer.");
                        Consumer.Dispose();
                        ct = SetupConsumer(ConsumerConfig, deserializer);
                        Logger.LogInformation("Consumer recreated, continuing with new consumer.");

                    }
                    catch (Exception ex)
                    {
                        Logger.LogError(ex, "An error occurred while deserializing the message.");
                        Consumer.Dispose();
                        ct = SetupConsumer(ConsumerConfig, deserializer);
                        Logger.LogInformation("Consumer recreated, continuing with new consumer.");
                    }
                    await Task.Delay(5);
                }
            }, TokenSource.Token);
        }

        protected virtual CancellationToken SetupConsumer(ConsumerConfig consumerConfig, IDeserializer<T> deserializer)
        {
            Consumer = new ConsumerBuilder<Ignore, T>(ConsumerConfig)
                            .SetValueDeserializer(deserializer)
                            .Build();

            Logger.LogInformation($"Starting consumer. Subscribing to topics {string.Join(",", Topics)}");
            Consumer.Subscribe(Topics);

            TokenSource = new CancellationTokenSource();
            CancellationToken ct = TokenSource.Token;

            return ct;
        }

        protected abstract string GroupId { get; }

        protected abstract string[] Topics { get; }

        protected CancellationTokenSource TokenSource { get; set; }

        protected ConsumerConfig ConsumerConfig { get; }

        protected IConsumer<Ignore, T> Consumer { get; set; }

        protected abstract Task Consume(T message);

        public void Dispose()
        {
            Consumer.Dispose();
        }
    }
}
