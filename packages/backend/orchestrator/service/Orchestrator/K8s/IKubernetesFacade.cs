﻿using k8s.Models;

namespace Orchestrator.K8s;

public interface IKubernetesFacade
{
    /// <summary>
    /// Creates a jobTemplate.
    /// </summary>
    /// <returns></returns>
    Task<KubernetesJob> CreateJob(KubernetesJobTemplate jobTemplate);

    /// <summary>
    /// Creates a jobTemplate.
    /// </summary>
    /// <returns></returns>
    Task<bool> TerminateJob(string jobId, string jobNamespace = "default");

    /// <summary>
    /// True if the pod is in the status "Failed" or "Succeeded", false otherwise
    /// </summary>
    Task<bool> IsJobPodFinished(string jobName, string jobNamespace = "default");
}