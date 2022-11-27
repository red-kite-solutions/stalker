namespace Orchestrator.Jobs.JobTemplates;

public class DomainNameResolvingJobTemplate : PythonJobTemplate
{

    public DomainNameResolvingJobTemplate(string? id, string @namespace, string hostname, PythonJobTemplateProvider jobProvider) : base(id, @namespace, jobProvider)
    {
        EnvironmentVariable["HOSTNAME"] = hostname;
    }
}