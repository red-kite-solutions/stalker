using System.Text;

namespace Orchestrator.Jobs.JobTemplates;

public class TcpPortScanningJobTemplate : PythonJobTemplate
{
    private readonly int CpuUnitLimit = 2000;
    private readonly int MemoryLimit = 2048;

    public TcpPortScanningJobTemplate(string? id, string @namespace, string targetIp, int threads, float socketTimeoutSeconds, int portMin, int portMax, int[] ports, JobTemplateProvider jobProvider) : base(id, @namespace, jobProvider)
    {
        EnvironmentVariable["TARGET_IP"] = targetIp;
        // EnvironmentVariable["THREADS"] = threads.ToString();
        EnvironmentVariable["THREADS"] = "1";
        EnvironmentVariable["SOCKET_TIMEOUT"] = socketTimeoutSeconds.ToString();
        // EnvironmentVariable["PORT_MIN"] = portMin.ToString();
        // EnvironmentVariable["PORT_MAX"] = portMax.ToString();
        EnvironmentVariable["PORT_MIN"] = "22";
        EnvironmentVariable["PORT_MAX"] = "32";
        StringBuilder portsStringBuilder = new StringBuilder();
        
        if(ports.Length > 0)
        {
            portsStringBuilder.Append('[');
            foreach (var p in ports)
            {
                portsStringBuilder.Append(p).Append(',');
            }
            portsStringBuilder[portsStringBuilder.Length - 1] = ']';
        } else
        {
            portsStringBuilder.Append("[]");
        }

        EnvironmentVariable["PORTS"] = portsStringBuilder.ToString();
        Console.WriteLine(EnvironmentVariable["TARGET_IP"]);
        Console.WriteLine(EnvironmentVariable["THREADS"]);
        Console.WriteLine(EnvironmentVariable["SOCKET_TIMEOUT"]);
        Console.WriteLine(EnvironmentVariable["PORT_MIN"]);
        Console.WriteLine(EnvironmentVariable["PORT_MAX"]);
        Console.WriteLine(EnvironmentVariable["PORTS"]);

        int cpuUnit = 20 * threads;
        cpuUnit = cpuUnit > CpuUnitLimit ? CpuUnitLimit : cpuUnit;
        int memory = 20 * threads;
        memory = memory > MemoryLimit ? MemoryLimit : memory;

        cpuUnit = 1000;
        memory = 1024;

        var limitQuantity = new Dictionary<string, k8s.Models.ResourceQuantity>();
        limitQuantity["cpu"] = new k8s.Models.ResourceQuantity(cpuUnit.ToString() + "m");
        limitQuantity["memory"] = new k8s.Models.ResourceQuantity(memory.ToString() + "Mi");

        Ressources = new k8s.Models.V1ResourceRequirements(limitQuantity);

        
    }
}