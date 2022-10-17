namespace Orchestrator.Events;

public class JobEventMessage
{
    /// <summary>
    /// Gets the job id associated with this event.
    /// </summary>
    public string? JobId { get; init; }

    /// <summary>
    /// Gets the findings associates with this event in json.S
    /// </summary>
    public string? FindingsJson { get; init; }
}