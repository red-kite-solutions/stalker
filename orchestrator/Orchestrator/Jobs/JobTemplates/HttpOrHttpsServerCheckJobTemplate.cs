using System.Text;
using System.Text.Json;

namespace Orchestrator.Jobs.JobTemplates;

public class HttpOrHttpsServerCheckJobTemplate : PythonJobTemplate
{
    public HttpOrHttpsServerCheckJobTemplate(string? id, string @namespace, string targetIp, int[] ports, PythonJobTemplateProvider jobProvider) : base(id, @namespace, jobProvider)
    {
        EnvironmentVariable["TARGET_IP"] = targetIp;
        EnvironmentVariable["PORTS"] = JsonSerializer.Serialize(ports);
    }
}