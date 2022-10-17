namespace Orchestrator.Queue;

public interface IMessagesProducer<T> where T : class
{
    Task Produce(T message);
}