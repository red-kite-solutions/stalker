namespace Orchestrator.Events
{
    public class TcpPortsFinding: Finding
    {
        public override string Type => nameof(TcpPortsFinding);

        public string? Ip { get; init; }

        public IList<string>? Ports { get; init; }
    }
}
