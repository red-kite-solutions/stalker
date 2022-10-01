namespace Orchestrator.Services.Events;

public class HostnameIpFinding : Finding
{
    public override string Type => nameof(HostnameIpFinding);

    public string DomainName { get; set; }

    public IList<string> Ips { get; set; }
}