using Orchestrator.Jobs.JobModelCache;

namespace Orchestrator.Queue.JobModelsConsumer
{
    public class JobModelUpdateRequest
    {
        public string? Id { get; init; }
        public JobModel? Model { get; init; }
    }
}
