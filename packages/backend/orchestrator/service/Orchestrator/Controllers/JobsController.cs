using Microsoft.AspNetCore.Mvc;
using Orchestrator.Controllers.dto;
using Orchestrator.Events;
using Orchestrator.Jobs.JobTemplates;
using Orchestrator.Queue;

namespace Orchestrator.Controllers
{
    public class JobsController : Controller
    {
        private JobEventsProducer EventsProducer { get; set; }
        private IMessagesProducer<JobLogMessage> LogsProducer { get; set; }
        private IFindingsParser Parser { get; set; }

        private static long CurrentTimeMs
        {
            get
            {
                DateTimeOffset dto = new DateTimeOffset(DateTime.Now.ToUniversalTime());
                return dto.ToUnixTimeMilliseconds();
            }
        }

        public JobsController(IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser)
        {
            EventsProducer = eventsProducer as JobEventsProducer;
            LogsProducer = jobLogsProducer;
            Parser = parser;
        }

        private async Task HandleEvent(EventModel evt, JobContext context)
        {

            if (evt is JobLogModel jobLog)
            {
                await LogsProducer.Produce(new JobLogMessage()
                {
                    JobId = context.Id,
                    ProjectId = context.ProjectId,
                    Log = jobLog.data,
                    LogLevel = jobLog.LogType,
                    Timestamp = CurrentTimeMs
                });
            }

            if (evt is FindingsEventModel)
            {
                await EventsProducer.Produce(new JobEventMessage
                {
                    JobId = context.Id,
                    ProjectId = context.ProjectId,
                    FindingsJson = evt.data,
                    Timestamp = CurrentTimeMs
                });
            }
        }

        // POST /Jobs/Finding
        [HttpPost]
        public async Task<ActionResult> Finding([FromBody] JobFindingDto dto)
        {
            try
            {
                var context = new JobContext(dto.RedKiteContext);

                var evt = Parser.Parse(dto.Finding);
                if (evt == null) return BadRequest("Invalid finding");
                await HandleEvent(evt, context);
            }
            catch (Exception)
            {
                return BadRequest("Error while handling finding. Finding is likely invalid.");
            }

            return Ok();
        }

        // POST /Jobs/Status
        [HttpPost]
        public async Task<ActionResult> Status([FromBody] StatusUpdateDto dto)
        {
            var acceptableStatuses = new HashSet<string>() { "Success", "Failed", "Ended" };
            if (!acceptableStatuses.Contains(dto.Status))
            {
                return BadRequest("Status should be Success, Failed or Ended");
            }

            try
            {
                var context = new JobContext(dto.RedKiteContext);

                await EventsProducer.LogStatus(context, dto.Status);
            }
            catch
            {
                return BadRequest("Error with job.");
            }
            return Ok();
        }
    }
}
