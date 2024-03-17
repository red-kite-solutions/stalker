using Orchestrator.Queue;

namespace Orchestrator.Events;

public class JobEventsProducer : MessagesProducer<JobEventMessage>
{
    protected override string Topic => Constants.JobFindingsTopic;

    public JobEventsProducer(IConfiguration config, ILogger<KafkaConsumer<JobEventMessage>> logger) : base(new JsonSerializer<JobEventMessage>(), config, logger)
    { }
}