﻿namespace Orchestrator.Events;

public abstract class EventModel
{
    // TODO: Parse events in order to sanitize the data and such
    //public IList<HostnameIpFinding> Findings { get; set; } = new List<HostnameIpFinding>();

    public string? data { get; init; }
}