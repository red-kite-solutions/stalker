namespace Orchestrator.Events;

public interface IFindingsParser
{
    EventModel? Parse(string? evtString);

    string? GetEventData(string? evtString, string? prefix = null);
}