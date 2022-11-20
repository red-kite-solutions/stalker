namespace Orchestrator.Queue.JobsConsumer.JobRequests;

public class TcpPortScanningJobRequest : JobRequest
{
    public static readonly string Discriminator = "TcpPortScanningJob";

    public string? TargetIp { get; init; }
    public int Threads { get; init; }
    public float SocketTimeoutSeconds { get; init; }
    public int PortMin { get; init; }
    public int PortMax { get; init; }
    public int[]? Ports { get; init; }

    public override string Task => Discriminator;
}