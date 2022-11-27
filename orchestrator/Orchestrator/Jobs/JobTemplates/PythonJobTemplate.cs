using Orchestrator.K8s;

namespace Orchestrator.Jobs.JobTemplates;

public abstract class PythonJobTemplate : KubernetesJobTemplate
{
    public override string[] Command => new[] { "python", "-c", PythonCommand };

    public override string Image => "python:3.10.4-slim-bullseye";
    //public override string Image => "python:3.8.15-bullseye";

    protected virtual string PythonCommand { get; set; }

    /// <summary>
    /// Creates a PythonJobTemplate object where the python code is read from a JobTemplateProvider
    /// </summary>
    /// <param name="id"></param>
    /// <param name="namespace"></param>
    /// <param name="jobProvider">A JobTemplateProvider that will be used to automatically find the job command</param>
    public PythonJobTemplate(string? id, string @namespace, JobTemplateProvider jobProvider)
    {
        Id = Id;
        Namespace = @namespace;
        var command = jobProvider.GetJobTemplateCode(this.GetType().UnderlyingSystemType);
        PythonCommand = command;
    }

    public PythonJobTemplate(string? id, string @namespace)
    {
        Id = Id;
        Namespace = @namespace;
        PythonCommand = "";
    }
}