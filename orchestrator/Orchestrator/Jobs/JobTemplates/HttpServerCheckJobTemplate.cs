using System.Text;
using System.Text.Json;

namespace Orchestrator.Jobs.JobTemplates;

public class HttpServerCheckJobTemplate : PythonJobTemplate
{
    public HttpServerCheckJobTemplate(string? id, IConfiguration config, string targetIp, int[] ports, PythonJobTemplateProvider jobProvider) : base(id, config, jobProvider)
    {
        EnvironmentVariable["TARGET_IP"] = targetIp;
        EnvironmentVariable["PORTS"] = JsonSerializer.Serialize(ports);
    }
}