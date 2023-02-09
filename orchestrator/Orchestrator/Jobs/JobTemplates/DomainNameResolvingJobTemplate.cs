namespace Orchestrator.Jobs.JobTemplates;

public class DomainNameResolvingJobTemplate : PythonJobTemplate
{

    public DomainNameResolvingJobTemplate(string? id, IConfiguration config, string hostname, PythonJobTemplateProvider jobProvider) : base(id, config, jobProvider)
    {
        EnvironmentVariable["HOSTNAME"] = hostname;
    }
}