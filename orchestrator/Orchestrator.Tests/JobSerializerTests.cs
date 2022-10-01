using Confluent.Kafka;
using FluentAssertions;
using Orchestrator.Queue.JobsConsumer;
using System.Text;

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
            CompanyId = "456",
            DomainName = "www.google.com",
        };

        // Act & Assert
        AssertRoundTrip(job);
    }

    [Fact]
    public void Deserialize_String_Workd()
    {
        // Arrange
        var serialized = "{\"jobId\":\"6337aced7193bb0125cdb4ae\",\"task\":\"DomainNameResolvingJob\",\"domainName\":\"amazon.com\",\"companyId\":\"63378fcfa4c49800434582c3\"}";

        var deserializer = new JobSerializer<JobRequest>();
        var actual = deserializer.Deserialize(Encoding.ASCII.GetBytes(serialized), false, SerializationContext.Empty);
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