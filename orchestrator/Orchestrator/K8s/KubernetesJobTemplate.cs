using k8s.Models;

namespace Orchestrator.K8s;

public class KubernetesJobTemplate
{
    public string Id { get; init; }

    /// <summary>
    /// Gets the docker image for this job.
    /// </summary>
    public virtual string Image { get; init; }

    /// <summary>
    /// Entrypoint array. If not provided, the docker image's ENTRYPOINT will be used.
    /// </summary>
    public virtual string[] Command { get; init; }

    /// <summary>
    /// Gets the environment variables for this job.
    /// </summary>
    public Dictionary<string, string> EnvironmentVariable { get; } = new();

    /// <summary>
    /// Gets the maximum number of times a job may be retried in case of failure.
    /// </summary>
    public int MaxRetries { get; init; } = 2;

    /// <summary>
    /// Gets the namespace the job should be created in.
    /// </summary>
    public string Namespace { get; init; } = "default";

    /// <summary>
    /// Specifies the amount of CPU time will be dedicated for a job pod, in millicpu. 
    /// 1000 millicpu represents a full CPU dedicated to the job pod.
    /// Additional info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
    /// </summary>
    public int MilliCpu { get; init; } = -1;

    /// <summary>
    /// Specifies the amount of memory (RAM) that will be dedicated for a job pod, in megabytes. 
    /// The value 1024 would represent a full gigabytes of ram dedicated to the job pod.
    /// The suffix used is the power of two, Mi
    /// Additional info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
    /// </summary>
    public int MemoryMegaBytes { get; init; } = -1;
}