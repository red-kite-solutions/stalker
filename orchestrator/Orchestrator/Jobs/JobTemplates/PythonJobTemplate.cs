using Orchestrator.K8s;

namespace Orchestrator.Jobs.JobTemplates;

public abstract class PythonJobTemplate : KubernetesJobTemplate
{
    public override string[] Command => new[] { "python", "-c", PythonCommand };

    public override string Image => "python-job-base:v1";

    protected virtual string PythonCommand { get; set; }

    protected IConfiguration Config { get; init; }

    /// <summary>
    /// Creates a PythonJobTemplate object where the python code is read from a PythonJobTemplateProvider
    /// </summary>
    /// <param name="id"></param>
    /// <param name="config"></param>
    /// <param name="jobProvider">A PythonJobTemplateProvider that will be used to automatically find the job command</param>
    public PythonJobTemplate(string? id, IConfiguration config, PythonJobTemplateProvider jobProvider)
    {
        Id = Id;
        Config = config;
        SetNamespace();
        var command = jobProvider.GetJobTemplateCode(this.GetType().UnderlyingSystemType);
        PythonCommand = command;
    }

    public PythonJobTemplate(string? id, IConfiguration config)
    {
        Id = Id;
        Config = config;
        SetNamespace();
        PythonCommand = "";
    }

    private void SetNamespace()
    {
        string? k8sNamespace = Config.GetSection("Jobs").GetValue<string>("Namespace");
        if (k8sNamespace == null) throw new NullReferenceException("Setting Jobs Namespace is missing.");
        Namespace = k8sNamespace;
    }
}