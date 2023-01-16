using Microsoft.IdentityModel.Tokens;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Jobs.JobTemplates;

public class PythonCustomJobTemplate : PythonJobTemplate
{

    public PythonCustomJobTemplate(string? id, string @namespace, JobParameter[]? jobParameters, string? code) : base(id, @namespace)
    {
        // Ajouter manuellement les parametres en variable d'environnement
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
    }
}