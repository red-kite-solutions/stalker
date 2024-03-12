using Microsoft.AspNetCore.Mvc;
using Orchestrator.Controllers.dto;
using Orchestrator.Events;
using Orchestrator.Queue;

namespace Orchestrator.Controllers
{
    public class JobsController : Controller
    {
        private IMessagesProducer<JobEventMessage> EventsProducer { get; set; }
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
            EventsProducer = eventsProducer;
            LogsProducer = jobLogsProducer;
            Parser = parser;
        }

        private async Task HandleEvent(EventModel evt, string jobId)
        {
            if (evt is JobLogModel jobLog)
            {
                await LogsProducer.Produce(new JobLogMessage()
                {
                    JobId = jobId,
                    Log = jobLog.data,
                    LogLevel = jobLog.LogType,
                    Timestamp = CurrentTimeMs
                });
            }

            if (evt is FindingsEventModel)
            {
                await EventsProducer.Produce(new JobEventMessage
                {
                    JobId = jobId,
                    FindingsJson = evt.data,
                    Timestamp = CurrentTimeMs
                });
            }
        }

        // POST /Jobs/Finding
        [HttpPost]
        public async Task<ActionResult> Finding([FromBody]JobFindingDto dto)
        {
            var evt = Parser.Parse(dto.Finding);

            if (evt == null) return BadRequest("Invalid finding");
            await HandleEvent(evt, dto.JobId);

            return Ok();
        }

        // POST /Jobs/Status
        [HttpPost]
        public async Task<ActionResult> Status([FromBody]StatusUpdateDto status)
        {
            if (status.Status != "Success" && status.Status != "Failed")
            {
                return BadRequest("Status should be Success or Failed");
            }

            // Eventually support Failed jobs
            await EventsProducer.Produce(new JobEventMessage
            {
                JobId = status.JobId,
                FindingsJson = "{ \"findings\": [{ \"type\": \"JobStatusFinding\", \"status\": \"Success\" }]}",
                Timestamp = CurrentTimeMs,
            });

            return Ok();
        }
    }
}
