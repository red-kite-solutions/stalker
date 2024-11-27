using Microsoft.IdentityModel.Tokens;
using Orchestrator.K8s;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.JobTemplates;

public class NucleiCustomJobTemplate : KubernetesJobTemplate
{
    public override string Image => "ghcr.io/red-kite-solutions/stalker-nuclei-job-base:1";
    protected IConfiguration Config { get; init; }

    public NucleiCustomJobTemplate(string? id, IConfiguration config, JobParameter[]? jobParameters, string? code, int? jobPodMilliCpuLimit, ulong? jobPodMemoryKbLimit, string? findingHandler)
    {
        Id = id;
        Config = config;
        SetNamespace();
        EnvironmentVariable["RedKiteJobId"] = Id;

        // Adding parameters as environment variables
        if (!jobParameters.IsNullOrEmpty())
        {
            foreach (var param in jobParameters!)
            {
                if (param.Name.IsNullOrEmpty() || param == null) continue;
                EnvironmentVariable[param.Name!] = param.Value!;
            }
        }

        if (!code.IsNullOrEmpty())
        {
            EnvironmentVariable["RK_NUCLEI_YAML_TEMPLATE"] = code!;
        }

        if (!findingHandler.IsNullOrEmpty())
        {
            EnvironmentVariable["NUCLEI_FINDING_HANDLER"] = findingHandler!;
        }

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

    private void SetNamespace()
    {
        string? k8sNamespace = Config.GetSection("Jobs").GetValue<string>("Namespace");
        if (k8sNamespace == null) throw new NullReferenceException("Setting Jobs Namespace is missing.");
        Namespace = k8sNamespace;
    }
}
