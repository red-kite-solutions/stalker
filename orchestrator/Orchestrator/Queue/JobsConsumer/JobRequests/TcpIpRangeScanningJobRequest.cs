namespace Orchestrator.Queue.JobsConsumer.JobRequests;

public class TcpIpRangeScanningJobRequest : JobRequest
{
    public static readonly string Discriminator = "TcpIpRangeScanningJob";

    public string? TargetIp { get; init; }
    public int TargetMask { get; init; }
    public int Rate { get; init; }
    public int PortMin { get; init; }
    public int PortMax { get; init; }
    public int[]? Ports { get; init; }

    public override string Task => Discriminator;
}
