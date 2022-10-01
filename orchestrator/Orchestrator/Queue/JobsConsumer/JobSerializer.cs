﻿using Confluent.Kafka;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Orchestrator.Queue.JobsConsumer;

public class JobSerializer<T> : ISerializer<T>, IDeserializer<T> where T : JobRequest
{
    private JsonSerializerOptions Options => new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public T Deserialize(ReadOnlySpan<byte> data, bool isNull, SerializationContext context)
    {
        if (isNull) throw new InvalidOperationException();

        var generic = JsonNode.Parse(data.ToArray());
        if (generic == null) throw new InvalidOperationException();

        var type = generic["Task"]?.GetValue<string>() ?? generic["task"]?.GetValue<string>();
        return type switch
        {
            "DomainNameResolvingJob" => JsonSerializer.Deserialize<DomainNameResolvingJobRequest>(data.ToArray(), Options) as T,
            _ => default
        } ?? throw new InvalidOperationException();
    }

    public byte[] Serialize(T data, SerializationContext context)
    {
        using var ms = new MemoryStream();

        string jsonString = JsonSerializer.Serialize(data, Options);
        var writer = new StreamWriter(ms);

        writer.Write(jsonString);
        writer.Flush();
        ms.Position = 0;

        return ms.ToArray();
    }
}