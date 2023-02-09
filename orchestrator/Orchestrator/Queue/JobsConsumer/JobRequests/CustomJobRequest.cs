namespace Orchestrator.Queue.JobsConsumer.JobRequests;

public class CustomJobRequest : JobRequest
{
    public static readonly string Discriminator = "CustomJob";

    public string? Name { get; init; }
    public string? Code { get; init; }
    public string? Type { get; init; }
    public string? Language { get; init; }
    public JobParameter[]? CustomJobParameters { get; init; }

    public override string Task => Discriminator;
}