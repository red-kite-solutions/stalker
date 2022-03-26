// import { JobsService } from 'src/modules/database/jobs/jobs.service';
// import { ManufacturedJob } from 'src/modules/database/jobs/jobs_factory/manufactured_job';

// export interface SubdomainBruteforceJobData {
//   domain_name: string;
//   wordlist: string;
// }

// export class SubdomainBruteforceJob extends ManufacturedJob {
//   typedData: SubdomainBruteforceJobData;

//   constructor(dbJobService: JobsService, program: string) {
//     super(dbJobService, program);
//     this.task = 'subdomain bruteforce';
//     this.priority = 3;
//     this.typedData = {
//       domain_name: '',
//       wordlist: '',
//     } as SubdomainBruteforceJobData;
//   }

//   public async saveToDatabase() {
//     this.data = this.typedData;
//     await super.saveToDatabase();
//   }

//   public addToJobQueue() {
//     this.data = this.typedData;
//     super.addToJobQueue();
//   }
// }
