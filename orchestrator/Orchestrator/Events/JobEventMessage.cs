namespace Orchestrator.Events;

public class JobEventMessage
{
    /// <summary>
    /// Gets the job id associated with this event.
    /// </summary>
    public string? JobId { get; init; }

    /// <summary>
    /// Gets the findings associates with this event in json.
    /// </summary>
    public string? FindingsJson { get; init; }

    /// <summary>
    /// The time at which the message was produced, unix epoch in ms
    /// </summary>
    public long Timestamp { get; init; }
}