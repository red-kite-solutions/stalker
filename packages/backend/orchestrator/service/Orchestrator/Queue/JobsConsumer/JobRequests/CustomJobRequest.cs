namespace Orchestrator.Queue.JobsConsumer.JobRequests;

public class CustomJobRequest : JobRequest
{
    public static readonly string Discriminator = "CustomJob";

    public string? JobModelId { get; init; }

    public JobParameter[]? CustomJobParameters { get; init; }

    public override string Task => Discriminator;
}