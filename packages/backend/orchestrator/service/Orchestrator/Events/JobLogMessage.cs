namespace Orchestrator.Events;

public class JobLogMessage
{
    /// <summary>
    /// Gets the job id associated with this log.
    /// </summary>
    public string? JobId { get; init; }

    /// <summary>
    /// Gets the project id associated with this JobId.
    /// </summary>
    public string? ProjectId { get; init; }

    /// <summary>
    /// Gets the log content.
    /// </summary>
    public string? Log { get; init; }

    /// <summary>
    /// Gets the log level.
    /// </summary>
    public LogLevel LogLevel { get; init; }

    /// <summary>
    /// The time at which the message was produced, unix epoch in ms
    /// </summary>
    public long Timestamp { get; init; }
}