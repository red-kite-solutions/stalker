using Microsoft.IdentityModel.Tokens;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.JobTemplates;

public class PythonCustomJobTemplate : PythonJobTemplate
{

    public PythonCustomJobTemplate(string? id, IConfiguration config, JobParameter[]? jobParameters, string? code) : base(id, config)
    {
        // Adding parameters as environment variables
        if (!jobParameters.IsNullOrEmpty())
        {
            foreach (var param in jobParameters!)
            {
                if (param.Name.IsNullOrEmpty() || param.Value.IsNullOrEmpty()) continue;
                EnvironmentVariable[param.Name!] = param.Value!;
            }
        }

        if (!code.IsNullOrEmpty())
        {
            Console.WriteLine("Giving code : " + code);
            PythonCommand = code!;
        }

        int? timeout = config.GetSection("Jobs").GetSection("CustomJobs").GetValue<int>("Timeout");
        if (timeout == null) throw new NullReferenceException("Setting Timeout is missing.");

        Timeout = timeout;
    }
}
