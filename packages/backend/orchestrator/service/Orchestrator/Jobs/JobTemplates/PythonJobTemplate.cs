using Orchestrator.K8s;

namespace Orchestrator.Jobs.JobTemplates;

public abstract class PythonJobTemplate : KubernetesJobTemplate
{
    public override string[] Command => new[] { "python", "/usr/src/main.py", PythonCommand };


    public override string[] PreStopCommand => new[] { "echo", "ILO MILO" };

    protected virtual string PythonCommand { get; set; }

    protected IConfiguration Config { get; init; }

    /// <summary>
    /// Creates a PythonJobTemplate object where the python code is read from a PythonJobTemplateProvider
    /// </summary>
    /// <param name="id"></param>
    /// <param name="config"></param>
    public PythonJobTemplate(string? id, IConfiguration config, string containerImage)
    {
        Id = id!;
        Config = config;
        SetNamespace();
        PythonCommand = "";
        EnvironmentVariable["RedKiteJobId"] = Id;
        Image = containerImage;
    }

    private void SetNamespace()
    {
        string? k8sNamespace = Config.GetSection("Jobs").GetValue<string>("Namespace");
        if (k8sNamespace == null) throw new NullReferenceException("Setting Jobs Namespace is missing.");
        Namespace = k8sNamespace;
    }
}
