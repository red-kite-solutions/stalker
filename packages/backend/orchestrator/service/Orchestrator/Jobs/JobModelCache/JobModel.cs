using Microsoft.Extensions.Primitives;

namespace Orchestrator.Jobs.JobModelCache
{
    public class JobModel
    {
        public string? Id { get; init; }
        public string? Name { get; init; }
        public string? Code { get; init; }
        public string? Type { get; init; }
        public string? Language { get; init; }
        public string? FindingHandler { get; init; }
        public string? FindingHandlerLanguage { get; init; }
    }
}
