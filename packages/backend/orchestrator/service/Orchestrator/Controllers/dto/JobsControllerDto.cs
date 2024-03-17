namespace Orchestrator.Controllers.dto
{
    public class JobUpdateDto 
    {
        public string JobId { get; set; }
    }

    public class StatusUpdateDto: JobUpdateDto
    {
        public string Status { get; set; }
    }

    public class JobFindingDto: JobUpdateDto
    {
        public string Finding { get; set; }
    }
}
