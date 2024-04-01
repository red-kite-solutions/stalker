using Confluent.Kafka;
using k8s.Models;
using Orchestrator.Jobs;
using Orchestrator.K8s;
using YamlDotNet.Core.Tokens;
using YamlDotNet.Serialization;

namespace Orchestrator.Queue.JobsConsumer;

public class JobsConsumer : KafkaConsumer<JobRequest>
{
    private IJobFactory JobFactory { get; }

    protected override string GroupId => "stalker";

    protected override string[] Topics => new[] { Constants.JobRequestsTopic };

    private string? K8sNamespace = "";

    private const string LimitsCpuKey = "limits.cpu";
    private const string LimitsMemoryKey = "limits.memory";
    private const int KbMultiplier = 1024;
    private const int MaxNextResourceCheckCounter = 5;
    private int NextResourceCheckCounter = MaxNextResourceCheckCounter;
    private const int ResourceCheckCooldown = 2000;

    public JobsConsumer(IJobFactory jobFactory, IConfiguration config, ILogger<JobsConsumer> logger)
        : base(config, new JobSerializer<JobRequest>(), logger)
    {
        JobFactory = jobFactory;
        K8sNamespace = config.GetSection("Jobs").GetValue<string>("Namespace");
    }

    protected override Task Consume(JobRequest request)
    {
        // The following logic prevents flooding Kubernetes with jobs requests by checking if enough resources are available to run the job
        NextResourceCheckCounter--;

        if (NextResourceCheckCounter <= 0)
        {
            bool waitForResources;
            do
            {
                V1ResourceQuotaList resourceQuotas = KubernetesFacade.GetJobNamespaceResources(K8sNamespace ?? "");

                // Kb means we need to multiply by 1024, MilliCPU means we need to multiply the given values in CPU by 1000
                var usedMemory = resourceQuotas.Items[0].Status.Used[LimitsMemoryKey].ToUInt64() + request.JobPodMemoryKbLimit * KbMultiplier;
                var usedMilliCpu = (int)(resourceQuotas.Items[0].Status.Used[LimitsCpuKey].ToDouble() * 1000) + request.JobPodMilliCpuLimit;
                var totalMemory = resourceQuotas.Items[0].Status.Hard[LimitsMemoryKey].ToUInt64();
                var totalMilliCpu = (int)(resourceQuotas.Items[0].Status.Hard[LimitsCpuKey].ToDouble() * 1000);

                var cpuRatio = ((float)usedMilliCpu) / totalMilliCpu;
                var memoryRatio = ((float)usedMemory) / totalMemory;
                var maxRatio = Math.Min(Math.Max(cpuRatio, memoryRatio), 1);

                // The closer to the max capacity of the namespace, the more often the check for resources will be done.
                NextResourceCheckCounter = Math.Min((int)Math.Ceiling((1 - maxRatio) * MaxNextResourceCheckCounter), MaxNextResourceCheckCounter);
                waitForResources = usedMemory > totalMemory || usedMilliCpu > totalMilliCpu;
                if (waitForResources)
                {
                    Thread.Sleep(ResourceCheckCooldown);
                }
            } while (waitForResources);
        }


#pragma warning disable CS4014
        HandleRequest(request);
#pragma warning restore CS4014

        return Task.CompletedTask;
    }

    private async Task HandleRequest(JobRequest request)
    {
        try
        {
            // Fire and forget; the job will cleanup itself.
            var jobCommand = JobFactory.Create(request);
            await jobCommand.Execute();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, $"An error occurred while handling job {request.JobId}.");
        }
    }
}