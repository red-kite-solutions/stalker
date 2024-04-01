using Orchestrator.Queue;

namespace Orchestrator.Events;

public class JobLogsProducer : MessagesProducer<JobLogMessage>
{
    protected override string Topic => Constants.JobLogsTopic;

    public JobLogsProducer(IConfiguration config, ILogger<KafkaConsumer<JobLogMessage>> logger) : base(new JsonSerializer<JobLogMessage>(), config, logger)
    { }
}