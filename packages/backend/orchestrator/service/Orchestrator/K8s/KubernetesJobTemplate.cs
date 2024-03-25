namespace Orchestrator.K8s;

public class KubernetesJobTemplate
{
    private readonly int MaxCpu = 2000;
    private readonly ulong MaxMemory = 2048 * 1024;
    private readonly int DefaultCpu = 100;
    private readonly ulong DefaultMemory = 300 * 1024;

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
    public string Namespace { get; set; } = "default";

    private int? _MilliCpuLimit;

    /// <summary>
    /// Specifies the limit amount of CPU time that will be dedicated for a job pod, in millicpu. 
    /// 1000 millicpu represents a full CPU dedicated to the job pod.
    /// Additional info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
    /// </summary>
    public int? MilliCpuLimit
    {
        get
        {
            return _MilliCpuLimit != null ? _MilliCpuLimit : DefaultCpu;
        }
        init
        {
            if (value <= 0) return;
            _MilliCpuLimit = value <= MaxCpu ? value : MaxCpu;
        }
    }

    private ulong? _MemoryKiloBytesLimit;

    /// <summary>
    /// Specifies the limit amount of memory (RAM) that will be dedicated for a job pod, in kilobytes. 
    /// The value 1024 would represent a full megabyte of ram dedicated to the job pod.
    /// The value 1048576 would represent a full gigabyte of ram dedicated to the job pod.
    /// The suffix used is the power of two, Ki
    /// Additional info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
    /// </summary>
    public ulong? MemoryKiloBytesLimit
    {
        get
        {
            return _MemoryKiloBytesLimit != null ? _MemoryKiloBytesLimit : DefaultMemory;
        }
        init
        {
            if (value <= 0) return;
            _MemoryKiloBytesLimit = value <= MaxMemory ? value : MaxMemory;
        }
    }

    private int? _Timeout;

    /// <summary>
    /// How long in seconds a job can run before it will be terminated by the system. A value of null
    /// will last indefinetly.
    /// </summary>
    public int? Timeout
    {
        get
        {
            return _Timeout;
        }
        set
        {
            if (value <= 0) return;
            _Timeout = value;
        }
    }
}