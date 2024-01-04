using Microsoft.IdentityModel.Tokens;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.JobTemplates;

public class NucleiCustomJobTemplate : PythonJobTemplate
{

    public NucleiCustomJobTemplate(string? id, IConfiguration config, JobParameter[]? jobParameters, string? code, int? jobPodMilliCpuLimit, int? jobPodMemoryKbLimit, string? findingHandler) : base(id, config)
    {
        // Adding parameters as environment variables
        if (!jobParameters.IsNullOrEmpty())
        {
            foreach (var param in jobParameters!)
            {
                if (param.Name.IsNullOrEmpty() || param.Value.IsNullOrEmpty()) continue;
                EnvironmentVariable[param.Name!] = param.Value!;
            }
        }

        if (!code.IsNullOrEmpty())
        {
            EnvironmentVariable["STALKER_NUCLEI_YAML_TEMPLATE"] = code!;
        }

        if (!findingHandler.IsNullOrEmpty())
        {
            EnvironmentVariable["NUCLEI_FINDING_HANDLER"] = findingHandler!;
        }

        PythonCommand = ""; // TODO: set code to start nuclei wrapper

        Image = "nuclei-job-base:v1";

        if (jobPodMilliCpuLimit.HasValue && jobPodMilliCpuLimit > 0)
        {
            this.MilliCpuLimit = jobPodMilliCpuLimit;
        }
        if (jobPodMemoryKbLimit.HasValue && jobPodMemoryKbLimit > 0)
        {
            this.MemoryKiloBytesLimit = jobPodMemoryKbLimit;
        }

        int? timeout = config.GetSection("Jobs").GetSection("CustomJobs").GetValue<int>("Timeout");
        if (timeout == null) throw new NullReferenceException("Setting Timeout is missing.");

        Timeout = timeout;
    }
}
