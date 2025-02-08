using Orchestrator.Queue.JobManagementConsumer;
using Orchestrator.Queue.JobsConsumer;

namespace Orchestrator.Jobs;

public interface IJobFactory
{
    JobCommand Create(JobRequest request);
    JobCommand Create(JobManagementRequest request);
}