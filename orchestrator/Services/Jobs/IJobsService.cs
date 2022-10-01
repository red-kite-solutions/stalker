namespace Orchestrator.Services.Jobs;

public interface IJobsService
{
    Task<JobStartedModel> Start(JobModel job);
}