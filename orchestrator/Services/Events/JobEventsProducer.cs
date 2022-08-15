using Orchestrator.Services.MessageQueue;

namespace Orchestrator.Services.Events;

public class JobEventsProducer : MessagesProducer<JobEventMessage>
{
    protected override string Topic => "stalker.jobs.findings";

    public JobEventsProducer(IConfiguration config, ILogger<KafkaConsumer<JobEventMessage>> logger) : base(new JsonSerializer<JobEventMessage>(), config, logger)
    { }
}