namespace Orchestrator.Events
{
    public enum LogLevel
    {
        Debug,
        Info,
        Warning,
        Error
    }

    public class JobLogModel : EventModel
    {
        public LogLevel LogType { get; init; }
    }
}
