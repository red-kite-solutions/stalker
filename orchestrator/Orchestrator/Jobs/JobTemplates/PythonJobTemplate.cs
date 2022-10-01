﻿using Orchestrator.K8s;

namespace Orchestrator.Jobs.JobTemplates;

public abstract class PythonJobTemplate : KubernetesJobTemplate
{
    public override string[] Command => new[] { "python", "-c", PythonCommand };

    public override string Image => "python:3.10.4-slim-bullseye";

    protected abstract string PythonCommand { get; }

    public PythonJobTemplate(string? id, string @namespace)
    {
        Id = Id;
        Namespace = @namespace;
    }
}