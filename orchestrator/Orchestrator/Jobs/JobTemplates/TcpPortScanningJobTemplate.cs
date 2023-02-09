using System.Text;
using System.Text.Json;

namespace Orchestrator.Jobs.JobTemplates;

public class TcpPortScanningJobTemplate : PythonJobTemplate
{
    public TcpPortScanningJobTemplate(string? id, IConfiguration config, string targetIp, int threads, float socketTimeoutSeconds, int portMin, int portMax, int[] ports, PythonJobTemplateProvider jobProvider) : base(id, config, jobProvider)
    {
        EnvironmentVariable["TARGET_IP"] = targetIp;
        EnvironmentVariable["THREADS"] = threads.ToString();
        EnvironmentVariable["SOCKET_TIMEOUT"] = socketTimeoutSeconds.ToString();
        EnvironmentVariable["PORT_MIN"] = portMin.ToString();
        EnvironmentVariable["PORT_MAX"] = portMax.ToString();
        EnvironmentVariable["PORTS"] = JsonSerializer.Serialize(ports);

        MilliCpuLimit = 10 * threads;
        MemoryKiloBytesLimit = 80 * threads + (1024 * 10);
    }
}