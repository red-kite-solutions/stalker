using Microsoft.IdentityModel.Tokens;
using Orchestrator.Events;
using Orchestrator.Jobs.Commands;
using Orchestrator.Jobs.JobManagementCommand;
using Orchestrator.Jobs.JobModelCache;
using Orchestrator.K8s;
using Orchestrator.Queue;
using Orchestrator.Queue.JobManagementConsumer;
using Orchestrator.Queue.JobManagementConsumer.JobManagementRequests;
using Orchestrator.Queue.JobsConsumer;
using Orchestrator.Queue.JobsConsumer.JobRequests;
using Orchestrator.Utils;
using System.Text.Json;

namespace Orchestrator.Jobs;

public class JobFactory : IJobFactory
{
    private IKubernetesFacade Kubernetes { get; }
    private JobEventsProducer EventsProducer { get; }
    private JobLogsProducer JobLogsProducer { get; }
    private IFindingsParser Parser { get; }
    private ILoggerFactory LoggerFactory { get; }
    private ILogger<JobFactory> Logger { get; }
    private IConfiguration Config { get; }

    public JobFactory(IKubernetesFacade kubernetes, IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser, ILoggerFactory loggerFactoryFactory, IConfiguration config)
    {
        JobLogsProducer = jobLogsProducer as JobLogsProducer;
        Kubernetes = kubernetes;
        EventsProducer = eventsProducer as JobEventsProducer;
        Parser = parser;
        LoggerFactory = loggerFactoryFactory;
        Logger = loggerFactoryFactory.CreateLogger<JobFactory>();
        Config = config;
    }

    public JobCommand Create(JobRequest request)
    {
        Logger.LogInformation(JsonSerializer.Serialize(request));

        return request switch
        {
            CustomJobRequest customJob => CreateCustomJobCommand(customJob),
            _ => throw new InvalidOperationException(),
        };
    }

    public JobCommand Create(JobManagementRequest request)
    {
        Logger.LogInformation(JsonSerializer.Serialize(request));

        return request switch
        {
            TerminateJobRequest managementRequest => new TerminateJobCommand(managementRequest, Kubernetes, EventsProducer, JobLogsProducer, Parser, LoggerFactory.CreateLogger<TerminateJobCommand>(), Config),
            _ => throw new InvalidOperationException(),
        };
    }

    private JobCommand CreateCustomJobCommand(CustomJobRequest request)
    {
        if (request.JobModelId == null) throw new InvalidOperationException();

        int maxParamValueDisplayLength = 100;
        string truncatedString = "[REDACTED]";

        var model = JobModelCache.JobModelCache.Get(request.JobModelId);

        if (!request.CustomJobParameters.IsNullOrEmpty())
        {
            List<string> logInfo = new List<string>();
            JobLogsProducer.LogDebug(request.JobId!, "Job started with the following input:");
            foreach (var parameter in request.CustomJobParameters!)
            {
                string value = parameter.Value ?? "";
                if (CryptoUtils.IsSecret(value))
                {
                    value = truncatedString;
                }
                else if (value.Length > maxParamValueDisplayLength) 
                {
                    value = string.Concat(value.AsSpan(0, maxParamValueDisplayLength), "[...]");
                }
                JobLogsProducer.LogDebug(request.JobId!, string.Concat("- ", parameter.Name, ": ", value));
            }
        } 
        else
        {
            JobLogsProducer.LogDebug(request.JobId!, "No parameters provided");
        }

        if (model.Type?.ToLower() == "code")
        {
            return model.Language?.ToLower() switch
            {
                "python" => new PythonCustomJobCommand(request, model, Kubernetes, EventsProducer, JobLogsProducer, Parser, LoggerFactory.CreateLogger<PythonCustomJobCommand>(), Config),
                _ => throw new InvalidOperationException(),
            };
        }

        if (model.Type?.ToLower() == "nuclei")
        {
            return new NucleiCustomJobCommand(request, model, Kubernetes, EventsProducer, JobLogsProducer, Parser, LoggerFactory.CreateLogger<NucleiCustomJobCommand>(), Config);
        }

        throw new InvalidOperationException();
    }
}