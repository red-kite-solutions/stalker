using Orchestrator.Events;
using Orchestrator.Queue;
using System.Text.Json;

namespace Orchestrator.Jobs;

public class JobEventsConsumer : KafkaConsumer<JobEventMessage>
{
    protected override string GroupId => "stalker";

    protected override string[] Topics => new[] { Constants.JobFindingsTopic };

    public JobEventsConsumer(IConfiguration config, ILogger<JobEventsConsumer> logger)
        : base(config, new JsonSerializer<JobEventMessage>(), logger)
    {
    }

    protected override Task Consume(JobEventMessage message)
    {
        Logger.LogInformation(JsonSerializer.Serialize(message));
        return Task.CompletedTask;
    }
}