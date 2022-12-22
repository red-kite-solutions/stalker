namespace Orchestrator.Events
{
    public class PortFinding: Finding
    {
        public override string Type => nameof(PortFinding);

        public string? Ip { get; init; }

        public string? Port { get; init; }

        public string? Protocol { get; init; }
    }
}
