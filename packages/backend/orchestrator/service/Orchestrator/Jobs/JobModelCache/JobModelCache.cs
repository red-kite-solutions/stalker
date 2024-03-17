namespace Orchestrator.Jobs.JobModelCache
{
    public static class JobModelCache
    {
        private static Dictionary<string, JobModel> JobCache = new();

        public static JobModel Get(string jobId)
        {
            return JobCache[jobId];
        }

        public static void AddOrUpdate(string jobId, JobModel job)
        {
            if(JobCache.ContainsKey(jobId))
            {
                JobCache[jobId] = job;
            }
            else
            {
                JobCache.Add(jobId, job);
            }
        }
    }
}
