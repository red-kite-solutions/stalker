using Confluent.Kafka;
using Confluent.Kafka.Admin;
using Orchestrator;
using Orchestrator.Events;
using Orchestrator.Jobs;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobModelsConsumer;
using Orchestrator.Queue.JobsConsumer;

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


// Initialize topics on startup
{
    using var admin = new AdminClientBuilder(adminConfig).Build();

    var expectedTopics = new[]
    {
        new TopicSpecification { Name = Constants.JobRequestsTopic, },
        new TopicSpecification { Name = Constants.JobFindingsTopic, },
        new TopicSpecification { Name = Constants.JobModelsTopic, },
    };

    try
    {
        var topicsMetadata = admin.GetMetadata(TimeSpan.FromSeconds(5)).Topics;
        var existingTopics = topicsMetadata.Select(x => x.Topic).ToHashSet();
        logger.LogInformation($"{string.Join(Environment.NewLine, topicsMetadata)}");

        var topicsToAdd = expectedTopics
            .Where(x => !existingTopics.Contains(x.Name))
            .ToList();

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

// Start consumer
app.Services.GetService<JobsConsumer>();
app.Services.GetService<JobModelsConsumer>();
app.MapGet("/version", () => "V1");
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
        .AddSingleton<JobModelsConsumer>()
        .AddSingleton<IMessagesProducer<JobEventMessage>, JobEventsProducer>()
        .AddSingleton<IMessagesProducer<JobLogMessage>, JobLogsProducer>()
        .AddTransient<IKubernetesFacade, KubernetesFacade>()
        .AddTransient<IJobFactory, JobFactory>()
        .AddTransient<IFindingsParser, FindingsParser>();
}
