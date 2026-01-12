using Confluent.Kafka;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.Queue;

namespace Orchestrator.Events;

public class JobLogsProducer : MessagesProducer<JobLogMessage>
{
    protected override string Topic => Constants.JobLogsTopic;

    public JobLogsProducer(IConfiguration config, ILogger<KafkaConsumer<JobLogMessage>> logger) : base(new JsonSerializer<JobLogMessage>(), config, logger)
    { }

    public async void LogDebug(JobContext context, string message)
    {
        await Produce(new JobLogMessage()
        {
            JobId = context.Id,
            ProjectId = context.ProjectId,
            Log = message,
            LogLevel = Events.LogLevel.Debug,
            Timestamp = TimeUtils.CurrentTimeMs()
        });
    }

    public async void LogDebug(string jobId, string message)
    {
        await Produce(new JobLogMessage()
        {
            JobId = jobId,
            ProjectId = "",
            Log = message,
            LogLevel = Events.LogLevel.Debug,
            Timestamp = TimeUtils.CurrentTimeMs()
        });
    }
}