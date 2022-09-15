using System.Net;
using Confluent.Kafka;
using Confluent.Kafka.Admin;
using Orchestrator;
using Orchestrator.Services.Events;
using Orchestrator.Services.Jobs;
using Orchestrator.Services.K8s;
using Orchestrator.Services.MessageQueue;

// Configure app
var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
ConfigureServices(builder.Services);

var app = builder.Build();
ConfigureApp(app);
app.UseDeveloperExceptionPage();
var logger = app.Logger;
var config = app.Configuration;

// Setup Kafka
var kafkaUri = config.GetSection("JobsQueue").GetValue<string>("QueueUri");
var adminConfig = new AdminClientConfig
{
    BootstrapServers = kafkaUri
};

var producerConfig = new ProducerConfig
{
    BootstrapServers = kafkaUri,
    ClientId = Dns.GetHostName(),
};

// Initialize topics on startup
{
    using var admin = new AdminClientBuilder(adminConfig).Build();

    var expectedTopics = new[]
    {
        new TopicSpecification { Name = Constants.JobRequestsTopic, },
        new TopicSpecification { Name = Constants.JobFindingsTopic, }
    };

    try
    {
        var topicsMetadata = admin.GetMetadata(TimeSpan.FromSeconds(5)).Topics;
        var existingTopics = topicsMetadata.Select(x => x.Topic).ToHashSet();
        logger.LogInformation($"{string.Join(Environment.NewLine, topicsMetadata)}");

        var topicsToAdd = expectedTopics.Where(x => !existingTopics.Contains(x.Name));

        if (topicsToAdd.Any())
        {
            logger.LogInformation($"Initializing topics [{string.Join(", ", topicsToAdd.Select(x => x.Name))}]");
            await admin.CreateTopicsAsync(topicsToAdd);
        }
        else
        {
            logger.LogInformation($"Topics already initialized [{string.Join(", ", existingTopics)}].");
        }
    }
    catch (Exception err)
    {
        logger.LogError(err.Message);
    }
}

using var producer = new ProducerBuilder<Null, JobMessage>(producerConfig).SetValueSerializer(new JsonSerializer<JobMessage>()).Build();

// Start consumer
app.Services.GetService<JobsConsumer>();

app.MapGet("/produce/{id}", async (string id) =>
{
    await producer.ProduceAsync(Constants.JobRequestsTopic, new Message<Null, JobMessage>
    {
        Value = new JobMessage { JobId = id }
    });

    return "Message produced.";
});

app.MapGet("/hello", () => "V1");

app.MapFallback(() => "V1");

app.Run();

void ConfigureApp(WebApplication app)
{
    app
        .UseHttpLogging();
}

void ConfigureServices(IServiceCollection services)
{
    services
        .AddResponseCompression()
        .AddSingleton<JobsConsumer>()
        .AddSingleton<IMessagesProducer<JobEventMessage>, JobEventsProducer>()
        .AddTransient<IKubernetesFacade, KubernetesFacade>()
        .AddTransient<IJobsService, JobsService>()
        .AddTransient<IFindingsParser, FindingsParser>();
}
