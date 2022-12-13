namespace Orchestrator.Events;

public class HostnameIpFinding : Finding
{
    public override string Type => nameof(HostnameIpFinding);

    public string? DomainName { get; init; }

    public string? Ip { get; init; }
}