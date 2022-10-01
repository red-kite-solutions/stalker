namespace Orchestrator.Services.Events;

public class FindingsParser : IFindingsParser
{
    private readonly string EventPrefix = "@event ";

    public string? GetEventJson(string? evtString)
    {
        if (evtString == null) return null;
        if (!evtString.StartsWith(EventPrefix)) return null;

        return evtString.Substring(EventPrefix.Length);
    }

    // TODO: It would probably be ideal if the parser could take in a stream instead of a string
    public EventModel? Parse(string? evtString)
    {
        var json = GetEventJson(evtString);
        if (json == null) return null;

        return new EventModel { FindingsJson = json };
    }

}