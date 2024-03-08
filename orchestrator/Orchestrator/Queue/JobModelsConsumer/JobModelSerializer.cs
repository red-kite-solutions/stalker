using Confluent.Kafka;
using System.Text.Json.Nodes;
using System.Text.Json;

namespace Orchestrator.Queue.JobModelsConsumer
{
    public class JobModelSerializer<T> : ISerializer<T>, IDeserializer<T> where T : JobModelUpdateRequest
    {
        private JsonSerializerOptions Options => new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public T Deserialize(ReadOnlySpan<byte> data, bool isNull, SerializationContext context)
        {
            try
            {
                if (isNull) throw new InvalidOperationException();

                var generic = JsonNode.Parse(data.ToArray());
                if (generic == null) throw new InvalidOperationException();

                return JsonSerializer.Deserialize<JobModelUpdateRequest>(data.ToArray(), Options) as T;
            }
            catch (JsonException)
            {
                // This part of the code prevents that the orchestrator breaks in case of bad serialization
                // It should be improved with better logging, possibly requeuing the messages with errors, etc.
                // Documented here: https://github.com/red-kite-solutions/stalker/issues/218
                Console.WriteLine("Error while deserializing a message, it seems like there may be an invalid message on the queue. Ignoring...");
                return null;
            }
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
}