namespace Orchestrator.Jobs
{
    public class PythonJobTemplateProvider : IJobTemplateProvider
    {
        private ILogger<PythonJobTemplateProvider> Logger { get; }
        private string PythonTemplatesPath { get; }
        private Dictionary<string, string> CodeDictionary { get; }

        // TODO: To prevent having to modify this file everytime a new python job is created, we could simply list the
        // content of the folder pythonTemplatesPath and automatically load all .py files
        private string[] PythonJobs = new[] { "DomainNameResolvingJobTemplate", "TcpPortScanningJobTemplate", "HttpServerCheckJobTemplate", "TcpIpRangeScanningJobTemplate" };

        public PythonJobTemplateProvider(ILogger<PythonJobTemplateProvider> logger, string pythonTemplatesPath)
        {
            Logger = logger;
            CodeDictionary = new Dictionary<string, string>();
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
            }
            catch (KeyNotFoundException e)
            {
                Logger.LogError($"Key {templateKey} not found in CodeDictionnary");
                throw e;
            }
            return code;
        }
    }
}
