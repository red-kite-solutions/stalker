﻿using Microsoft.AspNetCore.Mvc;
using Orchestrator.Controllers.dto;
using Orchestrator.Events;
using Orchestrator.Queue;
using System.Text.RegularExpressions;

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

        /// <summary>
        /// Validates that a string is a valid Mongodb Id by ensuring that it is 24 hexadecimal characters long
        /// </summary>
        /// <param name="jobId"></param>
        /// <returns></returns>
        private static bool IsValidJobId(string jobId)
        {
            if (string.IsNullOrEmpty(jobId)) return false;
            if (!Regex.IsMatch(jobId, @"^[a-f0-9]{24}$")) return false;
            return true;
        }

        public JobsController(IMessagesProducer<JobEventMessage> eventsProducer, IMessagesProducer<JobLogMessage> jobLogsProducer, IFindingsParser parser)
        {
            EventsProducer = eventsProducer as JobEventsProducer;
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
        public async Task<ActionResult> Finding([FromBody] JobFindingDto dto, string id = "")
        {
            if (!IsValidJobId(id)) return BadRequest("Job id is invalid");
            try
            {
                var evt = Parser.Parse(dto.Finding);

                if (evt == null) return BadRequest("Invalid finding");
                await HandleEvent(evt, id);
            }
            catch (Exception)
            {
                return BadRequest("Error while handling finding. Finding is likely invalid.");
            }

            return Ok();
        }

        // POST /Jobs/Status
        [HttpPost]
        public async Task<ActionResult> Status([FromBody] StatusUpdateDto dto, string id = "")
        {
            var acceptableStatuses = new HashSet<string>() { "Success", "Failed", "Ended" };
            if (!acceptableStatuses.Contains(dto.Status))
            {
                Console.WriteLine("bad status");
                return BadRequest("Status should be Success, Failed or Ended");
            }

            if (!IsValidJobId(id)) return BadRequest("Job id is invalid");

            await EventsProducer.LogStatus(id, dto.Status);

            return Ok();
        }
    }
}
