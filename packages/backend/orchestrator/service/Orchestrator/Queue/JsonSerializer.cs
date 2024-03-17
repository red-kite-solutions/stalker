using Confluent.Kafka;
using System.Text.Json;

namespace Orchestrator.Queue;

public class JsonSerializer<T> : ISerializer<T>, IDeserializer<T>
{
    public T Deserialize(ReadOnlySpan<byte> data, bool isNull, SerializationContext context)
    {
        if (isNull) return default;

        var value = JsonSerializer.Deserialize<T>(data.ToArray());

        return value ?? default;
    }

    public byte[] Serialize(T data, SerializationContext context)
    {
        using var ms = new MemoryStream();

        string jsonString = JsonSerializer.Serialize(data);
        var writer = new StreamWriter(ms);

        writer.Write(jsonString);
        writer.Flush();
        ms.Position = 0;

        return ms.ToArray();
    }
}