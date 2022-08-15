namespace Orchestrator.Services.K8s;

public class KubernetesJobTemplate
{
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
    public int MaxRetries { get; init; } = 4;

    /// <summary>
    /// Gets the namespace the job should be created in.
    /// </summary>
    public string Namespace { get; init; } = "default";
}