﻿using k8s;
using k8s.Models;
using Orchestrator.Events;
using Orchestrator.Queue;

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

        // Get the node selector in a hackish way. 
        // Ideally we would be able to configure multiple node selectors, but this is fine for now.
        var rawNodeSelector = Environment.GetEnvironmentVariable("JOBS_K8S_NODE_SELECTOR");

        var nodeSelector = new Dictionary<string, string>();
        if (rawNodeSelector != null)
        {
            var splitNodeSelector = rawNodeSelector?.Split('=');
            if (splitNodeSelector?.Length == 2)
            {
                nodeSelector[splitNodeSelector[0]] = splitNodeSelector[1];
            }
        }

        var kubernetesJob = new V1Job("batch/v1", "Job",
            new V1ObjectMeta
            {
                Name = jobName,
                Labels = new Dictionary<string, string>()
                {
                    ["red-kite.io/component"] = "job",
                    ["red-kite.io/jobid"] = jobTemplate.Id
                }
            },
            new V1JobSpec
            {
                Template = new V1PodTemplateSpec
                {
                    Metadata = new V1ObjectMeta
                    {
                        Labels = new Dictionary<string, string>()
                        {
                            ["red-kite.io/component"] = "job",
                            ["red-kite.io/jobid"] = jobTemplate.Id
                        }
                    },
                    Spec = new V1PodSpec
                    {
                        Containers = new List<V1Container>
                        {
                                new ()
                                {
                                    Name = "jobtemplate",
                                    Image = jobTemplate.Image,
                                    Command = jobTemplate.Command,
                                    Env = jobTemplate.EnvironmentVariable.Select(x => new V1EnvVar(x.Key, x.Value)).ToList(),
                                    Resources = resources,
}
                    },
                        NodeSelector = nodeSelector,
                        RestartPolicy = "Never",
                        TerminationGracePeriodSeconds = 100,
                        
                    },
                },
                BackoffLimit = jobTemplate.MaxRetries,
                ActiveDeadlineSeconds = jobTemplate.Timeout,
                TtlSecondsAfterFinished = 1,
            });

        Logger.LogInformation($"Creating job {jobName} in namespace {jobTemplate.Namespace}");

        // I think that this call can get a 403 Forbidden from the API if not enough ressources are available
        await RetryableCall(() => client.CreateNamespacedJobAsync(kubernetesJob, jobTemplate.Namespace));

        return RetryableCall(() => new KubernetesJob
        {
            Name = jobName,
            Namespace = jobTemplate.Namespace,
        });
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
    /// Terminates a job. The pod will be deleted after its termination grace period.
    /// </summary>
    /// <param name="jobId"></param>
    /// <param name="jobNamespace"></param>
    /// <returns>true if the job was running and terminated, false if it was not running.</returns>
    public async Task<bool> TerminateJob(string jobId, string jobNamespace = "default")
    {
        using var client = new Kubernetes(KubernetesConfiguration);
        string labelSelector = "red-kite.io/jobid=" + jobId;
        var jobs = RetryableCall(() => client.ListNamespacedJob(jobNamespace, labelSelector: labelSelector));
        var runningJob = jobs.Items.FirstOrDefault(job => job.Status.Active > 0);

        if (runningJob != null)
        {
            var options = new V1DeleteOptions(gracePeriodSeconds: 0, propagationPolicy: "Foreground");

            await RetryableCall(() => client.DeleteNamespacedJobAsync(runningJob.Metadata.Name, jobNamespace, options));
            return true;
        }
        
        return false;
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
                RandomWait();
                retryCount++;
            }
        } while (retryCount < maxRetry);

        throw new AggregateException(exceptions);
    }
}