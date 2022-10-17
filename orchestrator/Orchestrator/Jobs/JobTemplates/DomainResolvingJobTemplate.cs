namespace Orchestrator.Jobs.JobTemplates;

public class DomainNameResolvingJobTemplate : PythonJobTemplate
{
    protected override string PythonCommand => @"
import socket; 
import json; 
import os; 
hostname = os.environ['HOSTNAME']; 
data = socket.gethostbyname_ex(hostname); 
ipx = data[2]; 
print('@event {{ ""findings"": [ {{ ""type"": ""HostnameIpFinding"", ""domainName"": {0}, ""ips"": {1} }} ] }}'.format(json.dumps(hostname), json.dumps(ipx)))";

    public DomainNameResolvingJobTemplate(string? id, string @namespace, string hostname) : base(id, @namespace)
    {
        EnvironmentVariable["HOSTNAME"] = hostname;
    }
}