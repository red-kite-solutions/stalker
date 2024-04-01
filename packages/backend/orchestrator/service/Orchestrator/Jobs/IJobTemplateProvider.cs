namespace Orchestrator.Jobs
{
    public interface IJobTemplateProvider
    {
        public string GetJobTemplateCode(Type t);

        public void RefreshTemplates();
    }
}
