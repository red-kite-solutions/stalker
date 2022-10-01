namespace Orchestrator.Queue.JobsConsumer;

public class DomainNameResolvingJobRequest : JobRequest
{
    public static readonly string Discriminator = "DomainNameResolvingJob";

    public string? DomainName { get; init; }

    public override string Task => Discriminator;
}