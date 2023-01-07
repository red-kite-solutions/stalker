namespace Orchestrator.Queue.JobsConsumer.JobRequests;

public class HttpOrHttpsServerCheckJobRequest : JobRequest
{
    public static readonly string Discriminator = "HttpOrHttpsServerCheckJob";

    public string? TargetIp { get; init; }
    public int[]? Ports { get; init; }

    public override string Task => Discriminator;
}