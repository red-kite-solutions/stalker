using Orchestrator.Jobs;

namespace Orchestrator.Queue.JobsConsumer;

public class JobsConsumer : KafkaConsumer<JobRequest>
{
    private IJobFactory JobFactory { get; }

    protected override string GroupId => "stalker";

    protected override string[] Topics => new[] { Constants.JobRequestsTopic };

    public JobsConsumer(IJobFactory jobFactory, IConfiguration config, ILogger<JobsConsumer> logger)
        : base(config, new JobSerializer<JobRequest>(), logger)
    {
        JobFactory = jobFactory;
    }

    protected override Task Consume(JobRequest request)
    {
#pragma warning disable CS4014
        HandleRequest(request);
#pragma warning restore CS4014

        return Task.CompletedTask;
    }

    private async Task HandleRequest(JobRequest request)
    {
        try
        {

            // Fire and forget; the job will cleanup itself.
            var jobCommand = JobFactory.Create(request);
            await jobCommand.Execute();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, $"An error occurred while handling job {request.JobId}.");
        }
    }
}