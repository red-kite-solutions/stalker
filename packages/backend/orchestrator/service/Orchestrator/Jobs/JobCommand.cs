namespace Orchestrator.Jobs;

public abstract class JobCommand
{
    public abstract Task Execute();
}