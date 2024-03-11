using k8s;
using k8s.Models;
using System.Diagnostics;

namespace Orchestrator.K8s;

public class KubernetesFacade : IKubernetesFacade
{
    private readonly ILogger<KubernetesFacade> Logger;

    /// <summary>
    /// Gets or sets the Kubernetes configuration.
    /// </summary>
    //// private KubernetesClientConfiguration KubernetesConfiguration => KubernetesClientConfiguration.BuildConfigFromConfigFile(Environment.GetEnvironmentVariable("KUBECONFIG"));
    private static KubernetesClientConfiguration KubernetesConfiguration => KubernetesClientConfiguration.InClusterConfig();

    public KubernetesFacade(ILogger<KubernetesFacade> logger)
    {
        Logger = logger;
    }

    /// <summary>
    /// Creates a jobTemplate.
    /// </summary>
    /// <returns></returns>
    public async Task<KubernetesJob> CreateJob(KubernetesJobTemplate jobTemplate)
    {
        var config = KubernetesClientConfiguration.BuildDefaultConfig();
        using var client = new Kubernetes(config);

        var jobPrefix = "";
        var randomId = Guid.NewGuid().ToString(); // This id is used to avoid job name collisions in K8s
        var jobNameParts = new[] { jobPrefix, jobTemplate.Id, randomId };
        var jobName = string.Join("-", jobNameParts.Where(x => !string.IsNullOrEmpty(x)));

        // The ResourceQuota for the jobs' namespace requires an explicit resource allocation for every pod
        var limitQuantity = new Dictionary<string, ResourceQuantity>();
        limitQuantity["cpu"] = new ResourceQuantity(jobTemplate.MilliCpuLimit + "m");
        limitQuantity["memory"] = new ResourceQuantity(jobTemplate.MemoryKiloBytesLimit + "Ki");

        V1ResourceRequirements resources = new V1ResourceRequirements(limits: limitQuantity);

        var kubernetesJob = new V1Job("batch/v1", "Job",
            new V1ObjectMeta
            {
                Name = jobName,
            },
            new V1JobSpec
            {
                Template = new V1PodTemplateSpec
                {
                    Spec = new V1PodSpec
                    {
                        Containers = new List<V1Container>
                        {
                                new()
                                {
                                    Name = "jobtemplate",
                                    Image = jobTemplate.Image,
                                    Command = jobTemplate.Command,
                                    Env = jobTemplate.EnvironmentVariable.Select(x => new V1EnvVar(x.Key, x.Value)).ToList(),
                                    Resources = resources,
                                }
                        },
                        RestartPolicy = "Never",
                    },
                },
                BackoffLimit = jobTemplate.MaxRetries,
                ActiveDeadlineSeconds = jobTemplate.Timeout,
                TtlSecondsAfterFinished = 5
            });

        Logger.LogDebug($"Creating job {jobName} in namespace {jobTemplate.Namespace}");

        // I think that this call can get a 403 Forbidden from the API if not enough ressources are available
        await RetryableCall(() => client.CreateNamespacedJobAsync(kubernetesJob, jobTemplate.Namespace));

        return RetryableCall(() => new KubernetesJob
        {
            Name = jobName,
            Namespace = jobTemplate.Namespace,
        });
    }

    /// <summary>
    /// Gets the stream of logs for the given jobTemplate's pod.
    /// </summary>
    public async Task<Stream> GetJobLogs(string jobName, string jobNamespace = "default")
    {
        using var client = new Kubernetes(KubernetesConfiguration);
        V1PodList pods;
        do
        {
            Thread.Sleep(100);
            pods = await RetryableCall(() => client.ListNamespacedPodAsync(labelSelector: $"job-name={jobName}", limit: 1, namespaceParameter: jobNamespace));

        } while (pods?.Items == null || pods.Items.Count < 1 || pods.Items.FirstOrDefault()?.Status?.Phase == "Pending");

        return await RetryableCall(() => client.ReadNamespacedPodLogAsync(pods.Items.FirstOrDefault().Metadata.Name, jobNamespace, follow: true));
    }

    /// <summary>
    /// Deletes a jobTemplate.
    /// </summary>
    public async Task DeleteJob(string jobName, string jobNamespace = "default")
    {
        using var client = new Kubernetes(KubernetesConfiguration);
        await RetryableCall(() => client.DeleteCollectionNamespacedJobAsync(jobNamespace, fieldSelector: $"metadata.name={jobName}", propagationPolicy: "Foreground"));
    }

    /// <summary>
    /// True if the pod is in the status "Failed" or "Succeeded", false otherwise
    /// </summary>
    public async Task<bool> IsJobPodFinished(string jobName, string jobNamespace = "default")
    {
        using var client = new Kubernetes(KubernetesConfiguration);
        V1PodList pods = await RetryableCall(() => client.ListNamespacedPodAsync(labelSelector: $"job-name={jobName}", limit: 1, namespaceParameter: jobNamespace));

        if (pods.Items == null || pods.Items.Count < 1)
            return false;

        return RetryableCall(() => pods.Items.FirstOrDefault()?.Status?.Phase == "Succeeded" || pods.Items.FirstOrDefault()?.Status?.Phase == "Failed");
    }

    /// <summary>
    /// Allows to query a namespace for its memory and CPU limit and usage
    /// </summary>
    /// <param name="jobNamespace">The Kubernetes namespace's name</param>
    /// <returns>A list of the Resource Quotas applied to the namespace</returns>
    public static V1ResourceQuotaList GetJobNamespaceResources(string jobNamespace = "default")
    {
        using var client = new Kubernetes(KubernetesConfiguration);
        return RetryableCall(() => client.ListNamespacedResourceQuota(jobNamespace));
    }

    /// <summary>
    /// Sleeps the thread for a random time in seconds between min and max. This method is useful when, for instance, 
    /// you overload the Kubernetes API and wish to retry without all threads retrying at the same time. Retrying at 
    /// different times will spread the load on the API
    /// </summary>
    /// <param name="minSeconds">Minimal time in seconds to wait (default 10)</param>
    /// <param name="maxSeconds">Maximal time in seconds to wait (default 100)</param>
    public static void RandomWait(int minSeconds = 10, int maxSeconds = 100)
    {
        var time = new Random().Next(minSeconds, maxSeconds + 1);
        Thread.Sleep(time);
    }

    /// <summary>
    /// Retry a call to a function a number of times. It protects against the HttpOperationExceptions thrown by kubernetes
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="call">A function in the form () => myFunction(param1, param2, paramN)</param>
    /// <param name="maxRetry"></param>
    /// <returns></returns>
    /// <exception cref="AggregateException"></exception>
    private static T RetryableCall<T>(Func<T> call, int maxRetry = 10)
    {
        var exceptions = new List<Exception>();
        int retryCount = 0;
        do
        {
            try
            {
                return call();
            }
            catch (k8s.Autorest.HttpOperationException e)
            {
                exceptions.Add(e);
            }
            finally
            {
                RandomWait();
                retryCount++;
            }
        } while (retryCount < maxRetry);

        throw new AggregateException(exceptions);
    }
}