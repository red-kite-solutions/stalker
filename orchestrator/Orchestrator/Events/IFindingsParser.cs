namespace Orchestrator.Events;

public interface IFindingsParser
{
    EventModel? Parse(string? evtString);

    string? GetEventJson(string? evtString);
}