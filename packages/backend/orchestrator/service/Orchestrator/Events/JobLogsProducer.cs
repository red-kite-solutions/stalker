using Orchestrator.Queue;

namespace Orchestrator.Events;

public class JobLogsProducer : MessagesProducer<JobLogMessage>
{
    protected override string Topic => Constants.JobLogsTopic;

    public JobLogsProducer(IConfiguration config, ILogger<KafkaConsumer<JobLogMessage>> logger) : base(new JsonSerializer<JobLogMessage>(), config, logger)
    { }

    public async void LogDebug(string? JobId, string message)
    {
        await Produce(new JobLogMessage()
        {
            JobId = JobId,
            Log = message,
            LogLevel = Events.LogLevel.Debug,
            Timestamp = TimeUtils.CurrentTimeMs()
        });
    }
}