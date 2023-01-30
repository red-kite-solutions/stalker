namespace Orchestrator.Queue.JobsConsumer.JobRequests;

public class HttpServerCheckJobRequest : JobRequest
{
    public static readonly string Discriminator = "HttpServerCheckJob";

    public string? TargetIp { get; init; }
    public int[]? Ports { get; init; }

    public override string Task => Discriminator;
}