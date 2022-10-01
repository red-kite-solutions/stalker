namespace Orchestrator.K8s;

public interface IKubernetesFacade
{
    /// <summary>
    /// Creates a jobTemplate.
    /// </summary>
    /// <returns></returns>
    Task<KubernetesJob> CreateJob(KubernetesJobTemplate jobTemplate);

    /// <summary>
    /// Gets the stream of logs for the given jobTemplate's pod.
    /// </summary>
    Task<Stream> GetJobLogs(string jobName, string jobNamespace = "default");

    /// <summary>
    /// Deletes a jobTemplate.
    /// </summary>
    Task DeleteJob(string jobName, string jobNamespace = "default");
}