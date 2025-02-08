namespace Orchestrator.Queue.JobManagementConsumer;

public abstract class JobManagementRequest
{
    public abstract string Task { get; }

    public required string JobId { get; init; }
}