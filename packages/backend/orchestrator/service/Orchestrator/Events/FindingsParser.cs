namespace Orchestrator.Events;

public class FindingsParser : IFindingsParser
{
    private const string FindingEventPrefix = "@finding";
    private const string LogDebugEventPrefix = "@debug";
    private const string LogInfoEventPrefix = "@info";
    private const string LogWarningEventPrefix = "@warning";
    private const string LogErrorEventPrefix = "@error";

    public string? GetEventData(string? evtString, string? prefix = null)
    {
        if (evtString == null) return null;
        if (prefix == null)
        {
            prefix = GetEventPrefix(evtString);
            if (prefix == null) return null;
        }

        return evtString.Substring(prefix.Length).Trim();
    }

    public string? GetEventPrefix(string evtString)
    {
        if (evtString == null) return null;
        if (!evtString.StartsWith("@")) return null;

        var spaceIndex = evtString.IndexOf(" ");
        if (spaceIndex == -1) return null;

        return evtString[..spaceIndex];
    }

    // TODO: It would probably be ideal if the parser could take in a stream instead of a string
    public EventModel? Parse(string? evtString)
    {
        if (evtString == null) return null;

        var prefix = GetEventPrefix(evtString);
        if (prefix == null) return null;

        var data = GetEventData(evtString, prefix);
        if (data == null) return null;

        return prefix switch
        {
            FindingEventPrefix => new FindingsEventModel { data = data },
            LogDebugEventPrefix => new JobLogModel { data = data, LogType = LogLevel.Debug },
            LogInfoEventPrefix => new JobLogModel { data = data, LogType = LogLevel.Info },
            LogWarningEventPrefix => new JobLogModel { data = data, LogType = LogLevel.Warning },
            LogErrorEventPrefix => new JobLogModel { data = data, LogType = LogLevel.Error },
            _ => null
        };
    }

}