namespace Orchestrator.Jobs.JobModelCache
{
    public static class JobModelCache
    {
        private static Dictionary<string, JobModel> JobCache = new();

        public static JobModel Get(string jobId)
        {
            return JobCache[jobId];
        }

        public static void Add(string jobId, JobModel job)
        {
            JobCache.Add(jobId, job);
        }
    }
}
