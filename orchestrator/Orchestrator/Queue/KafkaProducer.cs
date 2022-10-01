using Confluent.Kafka;
using System.Net;
using System.Text.Json;

namespace Orchestrator.Queue;

public abstract class MessagesProducer<T> : IMessagesProducer<T> where T : class
{
    protected abstract string Topic { get; }

    private readonly ILogger<KafkaConsumer<T>> Logger;

    private IProducer<Null, T> Producer { get; }

    private ProducerConfig ProducerConfig { get; init; }

    protected MessagesProducer(ISerializer<T> serializer, IConfiguration config, ILogger<KafkaConsumer<T>> logger)
    {
        Logger = logger;
        var kafkaUri = config.GetSection("JobsQueue").GetValue<string>("QueueUri");
        ProducerConfig = new ProducerConfig()
        {
            BootstrapServers = kafkaUri,
            ClientId = Dns.GetHostName(),
        };

        Producer = new ProducerBuilder<Null, T>(ProducerConfig).SetValueSerializer(serializer).Build();
    }

    public async Task Produce(T message)
    {
        Logger.LogTrace($"Producing message to topic {Topic}: {JsonSerializer.Serialize(message)}");

        await Producer.ProduceAsync(Topic, new Message<Null, T>
        {
            Value = message,
        });
    }
}