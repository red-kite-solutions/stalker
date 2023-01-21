using k8s;
using k8s.Models;
using System;
using System.Formats.Asn1;

namespace Orchestrator.K8s;

public class KubernetesFacade : IKubernetesFacade
{
    private readonly ILogger<KubernetesFacade> Logger;

    /// <summary>
    /// Gets or sets the Kubernetes configuration.
    /// </summary>
    //// private KubernetesClientConfiguration KubernetesConfiguration => KubernetesClientConfiguration.BuildConfigFromConfigFile(Environment.GetEnvironmentVariable("KUBECONFIG"));
    private KubernetesClientConfiguration KubernetesConfiguration => KubernetesClientConfiguration.InClusterConfig();

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
        limitQuantity["cpu"] = new ResourceQuantity(jobTemplate.MilliCpuLimit.ToString() + "m");
        limitQuantity["memory"] = new ResourceQuantity(jobTemplate.MemoryKiloBytesLimit.ToString() + "Ki");

        V1ResourceRequirements ressources = new V1ResourceRequirements(limitQuantity);

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
                                    Resources = ressources
                                }
                        },
                        RestartPolicy = "Never",
                    },
                },
                BackoffLimit = jobTemplate.MaxRetries,
                ActiveDeadlineSeconds = jobTemplate.Timeout,
            });

        Logger.LogDebug($"Creating job {jobName} in namespace {jobTemplate.Namespace}");

        await client.CreateNamespacedJobAsync(kubernetesJob, jobTemplate.Namespace);

        return new KubernetesJob
        {
            Name = jobName,
            Namespace = jobTemplate.Namespace,
        };
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
            pods = await client.ListNamespacedPodAsync(labelSelector: $"job-name={jobName}", limit: 1, namespaceParameter: jobNamespace);

        } while (pods?.Items == null || pods.Items.Count < 1 || pods.Items.FirstOrDefault()?.Status?.Phase == "Pending");

        return await client.ReadNamespacedPodLogAsync(pods.Items.FirstOrDefault().Metadata.Name, jobNamespace);
    }

    /// <summary>
    /// Deletes a jobTemplate.
    /// </summary>
    public async Task DeleteJob(string jobName, string jobNamespace = "default")
    {
        using var client = new Kubernetes(KubernetesConfiguration);
        await client.DeleteCollectionNamespacedJobAsync(jobNamespace, fieldSelector: $"metadata.name={jobName}", propagationPolicy: "Foreground");
    }

    /// <summary>
    /// True if the pod is in the status "Failed" or "Succeeded", false otherwise
    /// </summary>
    public async Task<bool> IsJobPodFinished(string jobName, string jobNamespace = "default")
    {
        using var client = new Kubernetes(KubernetesConfiguration);
        V1PodList pods = await client.ListNamespacedPodAsync(labelSelector: $"job-name={jobName}", limit: 1, namespaceParameter: jobNamespace);

        if (pods.Items == null || pods.Items.Count < 1)
            return false;

        return pods.Items.FirstOrDefault()?.Status?.Phase == "Succeeded" || pods.Items.FirstOrDefault()?.Status?.Phase == "Failed";
    }
}