using Orchestrator.K8s;

namespace Orchestrator.Jobs.JobTemplates;

public abstract class PythonJobTemplate : KubernetesJobTemplate
{
    public override string[] Command => new[] { "python", "-c", PythonCommand };

    public override string Image => "ghcr.io/red-kite-solutions/stalker-python-job-base:2";

    protected virtual string PythonCommand { get; set; }

    protected IConfiguration Config { get; init; }

    /// <summary>
    /// Creates a PythonJobTemplate object where the python code is read from a PythonJobTemplateProvider
    /// </summary>
    /// <param name="id"></param>
    /// <param name="config"></param>
    public PythonJobTemplate(string? id, IConfiguration config)
    {
        Id = id!;
        Config = config;
        SetNamespace();
        PythonCommand = "";
        EnvironmentVariable["RedKiteJobId"] = Id;
    }

    private void SetNamespace()
    {
        string? k8sNamespace = Config.GetSection("Jobs").GetValue<string>("Namespace");
        if (k8sNamespace == null) throw new NullReferenceException("Setting Jobs Namespace is missing.");
        Namespace = k8sNamespace;
    }
}
