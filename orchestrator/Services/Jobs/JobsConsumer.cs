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

    protected override string[] Topics => new[] { Constants.JobRequestsTopic };

    public JobsConsumer(IJobsService jobsService, IConfiguration config, ILogger<JobsConsumer> logger)
        : base(config, logger)
    {
        JobsService = jobsService;
    }

    protected override async Task Consume(JobRequest request)
    {
        Logger.LogDebug(JsonSerializer.Serialize(request));

        // Fire and forget; the job will cleanup itself.
        JobsService.Start(new JobModel
        {
            Id = request.JobId,
        });
    }
}

public class JobEventsConsumer : KafkaConsumer<JobEventMessage>
{
    protected override string GroupId => "stalker";

    protected override string[] Topics => new[] { Constants.JobFindingsTopic };

    public JobEventsConsumer(IConfiguration config, ILogger<JobEventsConsumer> logger)
        : base(config, logger)
    {
    }

    protected override async Task Consume(JobEventMessage message)
    {
        Logger.LogDebug(JsonSerializer.Serialize(message));
    }
}