using System.Text;
using System.Text.Json;
using Orchestrator.Utils;

namespace Orchestrator.Jobs.JobTemplates;

public class JobContext
{
    public string Id;
    public string ProjectId;

    private const string IdKey = "Id";
    private const string ProjectIdKey = "ProjectId";
    private const string SignatureKey = "Signature";

    public string ToJsonSignedString()
    {
        var payload = BuildPayload();
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream, new JsonWriterOptions { Indented = false }))
        {
            writer.WriteStartObject();
            writer.WriteString(IdKey, Id);
            writer.WriteString(ProjectIdKey, ProjectId);
            writer.WriteBase64String(SignatureKey, CryptoUtils.Hmac256ComputeSignature(payload));
            writer.WriteEndObject();
        }

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private string BuildPayload(string id, string projectId)
    {
        return $"{id};{projectId}";
    }

    private string BuildPayload()
    {
        return BuildPayload(Id, ProjectId);
    }

    public JobContext(string id, string projectId)
    {
        Id = id;
        ProjectId = projectId;
    }

    public JobContext(string jobContextSignedJsonString)
    {
        if (string.IsNullOrEmpty(jobContextSignedJsonString))
            throw new ArgumentException("Job context string is null or empty.");

        using var doc = JsonDocument.Parse(jobContextSignedJsonString);
        var root = doc.RootElement;
        if (!root.TryGetProperty(IdKey, out var idElem) ||
           !root.TryGetProperty(ProjectIdKey, out var projElem) ||
           !root.TryGetProperty(SignatureKey, out var sigElem))
        {
            throw new FormatException("Invalid JobContext JSON: missing required properties.");
        }

        var id = idElem.GetString();
        var projectId = projElem.GetString();
        var signature = sigElem.GetString();
        var payload = BuildPayload(id ?? "", projectId ?? "");

        if (!CryptoUtils.Hmac256ValidateSignature(payload, signature ?? ""))
        {
            throw new ArgumentException("Signature verification failed.");
        }

        Id = id!;
        ProjectId = projectId!;
    }
}