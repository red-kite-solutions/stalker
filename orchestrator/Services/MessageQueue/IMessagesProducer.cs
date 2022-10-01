namespace Orchestrator.Services.MessageQueue;

public interface IMessagesProducer<T> where T : class
{
    Task Produce(T message);
}