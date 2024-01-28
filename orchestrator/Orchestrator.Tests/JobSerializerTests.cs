using Confluent.Kafka;
using FluentAssertions;
using Orchestrator.Queue.JobsConsumer;
using Orchestrator.Queue.JobsConsumer.JobRequests;

namespace Orchestrator.Tests;

public class JobSerializerTests
{
    [Fact]
    public void RoundTrip_DomainResolvingJob_Works()
    {
        // Arrange
        var job = new DomainNameResolvingJobRequest
        {
            JobId = "123",
            ProjectId = "456",
            DomainName = "www.google.com",
        };

        // Act & Assert
        AssertRoundTrip(job);
    }

    private void AssertRoundTrip<T>(T expected) where T : JobRequest
    {
        var serializer = new JobSerializer<T>();
        var serialized = serializer.Serialize(expected, SerializationContext.Empty);

        var deserializer = new JobSerializer<JobRequest>();
        var actual = deserializer.Deserialize(serialized, false, SerializationContext.Empty);

        actual.Should().BeEquivalentTo(expected);
    }
}