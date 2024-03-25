namespace Orchestrator.Queue.JobsConsumer;

public abstract class JobRequest
{
    public abstract string Task { get; }

    public string? JobId { get; init; }

    public string? ProjectId { get; init; }

    public int JobPodMilliCpuLimit { get; init; }
    public ulong JobPodMemoryKbLimit { get; init; }
}