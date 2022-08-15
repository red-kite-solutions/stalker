using System.Text.Json;
using Orchestrator.Services.Events;
using Orchestrator.Services.MessageQueue;

namespace Orchestrator.Services.Jobs;

public class JobMessage
{
    public string JobId { get; set; }
}

public class JobsConsumer : KafkaConsumer<JobMessage>
{
    private readonly IJobsService JobsService;
    protected override string GroupId => "stalker";

    protected override string[] Topics => new[] { "stalker.jobs.requests" };

    public JobsConsumer(IJobsService jobsService, IConfiguration config, ILogger<JobsConsumer> logger)
        : base(config, logger)
    {
        JobsService = jobsService;
    }

    protected override async Task Consume(JobMessage message)
    {
        Logger.LogDebug(JsonSerializer.Serialize(message));

        await JobsService.Start(new JobModel
        {
            Id = message.JobId,
        });
    }
}

public class JobEventsConsumer : KafkaConsumer<JobEventMessage>
{
    protected override string GroupId => "stalker";

    protected override string[] Topics => new[] { "stalker.jobs.findings" };

    public JobEventsConsumer(IConfiguration config, ILogger<JobEventsConsumer> logger)
        : base(config, logger)
    {
    }

    protected override async Task Consume(JobEventMessage message)
    {
        Logger.LogDebug(JsonSerializer.Serialize(message));
    }
}