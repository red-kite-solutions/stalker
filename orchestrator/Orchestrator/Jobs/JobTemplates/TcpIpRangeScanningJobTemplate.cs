using System.Text;
using System.Text.Json;

namespace Orchestrator.Jobs.JobTemplates;

public class TcpIpRangeScanningJobTemplate : PythonJobTemplate
{
    public TcpIpRangeScanningJobTemplate(string? id, IConfiguration config, string targetIp, int targetMask, int rate, int portMin, int portMax, int[] ports, PythonJobTemplateProvider jobProvider) : base(id, config, jobProvider)
    {
        EnvironmentVariable["TARGET_IP"] = targetIp;
        EnvironmentVariable["TARGET_MASK"] = targetMask.ToString();
        EnvironmentVariable["RATE"] = rate.ToString();
        EnvironmentVariable["PORT_MIN"] = portMin.ToString();
        EnvironmentVariable["PORT_MAX"] = portMax.ToString();
        EnvironmentVariable["PORTS"] = JsonSerializer.Serialize(ports);

        const int cpuMin = 100;
        const int minMemory = 1024 * 10;
        MilliCpuLimit = (int)(1 / 100000f * rate * 900) + cpuMin; // 1 CPU for rate = 100 000
        MemoryKiloBytesLimit = (int)(490*1024 * 1/100000f * rate) + minMemory; // 500 Mb  for rate = 100 000
    }
}