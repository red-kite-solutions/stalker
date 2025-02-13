namespace Orchestrator.Queue.JobManagementConsumer.JobManagementRequests;

public class TerminateJobRequest : JobManagementRequest
{
    public static readonly string Discriminator = "TerminateJob";

    public override string Task => Discriminator;
}