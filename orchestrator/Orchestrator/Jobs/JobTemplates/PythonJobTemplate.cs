using Orchestrator.K8s;

namespace Orchestrator.Jobs.JobTemplates;

public abstract class PythonJobTemplate : KubernetesJobTemplate
{
    public override string[] Command => new[] { "python", "-c", PythonCommand };

    public override string Image => "python-job-base:dgtWqAr";

    protected virtual string PythonCommand { get; set; }

    /// <summary>
    /// Creates a PythonJobTemplate object where the python code is read from a PythonJobTemplateProvider
    /// </summary>
    /// <param name="id"></param>
    /// <param name="namespace"></param>
    /// <param name="jobProvider">A PythonJobTemplateProvider that will be used to automatically find the job command</param>
    public PythonJobTemplate(string? id, string @namespace, PythonJobTemplateProvider jobProvider)
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