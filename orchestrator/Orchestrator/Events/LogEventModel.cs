namespace Orchestrator.Events
{
    public enum LogType 
    {
        Debug
    }

    public class LogEventModel: EventModel
    {
        public LogType? LogType { get; init; }
    }
}
