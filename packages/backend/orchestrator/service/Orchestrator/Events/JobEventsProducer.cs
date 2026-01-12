using System.Collections.ObjectModel;
using System.Linq;
using Confluent.Kafka;
using k8s.Models;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.Queue;

namespace Orchestrator.Events;

public class JobEventsProducer : MessagesProducer<JobEventMessage>
{
    protected override string Topic => Constants.JobFindingsTopic;

    public enum JobStatus
    {
        Success,
        Failed,
        Ended,
        Started
    }

    private static readonly Dictionary<JobStatus, string> JobStatusMapping = new Dictionary<JobStatus, string>()  {
        { JobStatus.Success, "Success" },
        { JobStatus.Failed, "Failed" },
        { JobStatus.Ended, "Ended" },
        { JobStatus.Started, "Started" }
    };

    private static Dictionary<string, JobStatus> InvertStatusMapping(Dictionary<JobStatus, string> jobStatusMapping)
    {
        Dictionary<string, JobStatus> dict = new();
        foreach (var kvp in jobStatusMapping)
        {
            dict[kvp.Value] = kvp.Key;
        }

        return dict;
    }

    private static readonly Dictionary<string, JobStatus> JobStatusInvertedMapping = InvertStatusMapping(JobStatusMapping);


    public JobEventsProducer(IConfiguration config, ILogger<KafkaConsumer<JobEventMessage>> logger) : base(new JsonSerializer<JobEventMessage>(), config, logger)
    { }


    public async Task LogStatus(JobContext context, JobStatus status)
    {
        await LogStatus(context, JobStatusMapping[status]);
    }

    public async Task LogStatus(string jobId, JobStatus status)
    {
        await LogStatus(jobId, JobStatusMapping[status]);
    }

    public async Task LogStatus(JobContext context, string status)
    {
        if (!JobStatusInvertedMapping.ContainsKey(status))
            throw new ArgumentException("Invalid job status");

        await Produce(new JobEventMessage
        {
            JobId = context.Id,
            ProjectId = context.ProjectId,
            FindingsJson = $"{{ \"findings\": [{{ \"type\": \"JobStatusFinding\", \"status\": \"{status}\" }}]}}",
            Timestamp = TimeUtils.CurrentTimeMs(),
        });
    }

    public async Task LogStatus(string jobId, string status)
    {
        if (!JobStatusInvertedMapping.ContainsKey(status))
            throw new ArgumentException("Invalid job status");

        await Produce(new JobEventMessage
        {
            JobId = jobId,
            ProjectId = "",
            FindingsJson = $"{{ \"findings\": [{{ \"type\": \"JobStatusFinding\", \"status\": \"{status}\" }}]}}",
            Timestamp = TimeUtils.CurrentTimeMs(),
        });
    }
}