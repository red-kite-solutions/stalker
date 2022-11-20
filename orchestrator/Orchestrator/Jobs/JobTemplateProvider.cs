using AutoMapper.Mappers;

namespace Orchestrator.Jobs
{
    public class JobTemplateProvider
    {
        private ILogger<JobTemplateProvider> Logger { get; }
        private string PythonTemplatesPath { get; }
        private Dictionary<string,string> CodeDictionary { get; }
        private string[] PythonJobs = new[] { "DomainNameResolvingJobTemplate", "TcpPortScanningJobTemplate" };

        public JobTemplateProvider(ILogger<JobTemplateProvider> logger, string pythonTemplatesPath)
        {
            Logger = logger;
            CodeDictionary = new Dictionary<string,string>();
            PythonTemplatesPath = pythonTemplatesPath;
            RefreshTemplates();
        }

        public void RefreshTemplates()
        {
            foreach (var pythonJob in PythonJobs)
            {
                var pythonScriptFilePath = PythonTemplatesPath + pythonJob + ".py";
                try
                {
                    CodeDictionary[pythonJob] = System.IO.File.ReadAllText(pythonScriptFilePath, System.Text.Encoding.UTF8);
                }
                catch
                {
                    Logger.LogError($"Error reading the python job template for path : {pythonScriptFilePath}");
                }
            }
        }

        public string GetJobTemplateCode(Type t)
        {
            var templateKey = t.Name;
            if (templateKey == null) return "";
            string code;
            try
            {
                code = CodeDictionary[templateKey];
            } catch (KeyNotFoundException e)
            {
                Logger.LogError($"Key {templateKey} not found in CodeDictionnary");
                throw e;
            }
            return code;
        }
    }
}
