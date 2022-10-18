namespace Orchestrator.Queue.JobsConsumer;

public abstract class JobRequest
{
    public abstract string Task { get; }

    public string? JobId { get; init; }

    public string? CompanyId { get; init; }
}