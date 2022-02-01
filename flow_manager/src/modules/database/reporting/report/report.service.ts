import { Injectable } from "@nestjs/common";
import { ReportEntryDto } from "./report.dto";
import { readFileSync, writeFileSync } from "fs";
import { Report } from "./report.model";
import { BaseService } from "src/services/base.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cron, CronExpression, Timeout } from "@nestjs/schedule";
import { KeybaseService } from "src/modules/alerts/keybase/keybase.service";
import { Domain } from "../domain/domain.model";
import { threadId } from "worker_threads";
import { Program } from "../program.model";
import { DomainTreeUtils } from "src/utils/domain_tree.utils";
import { Host, HostSchema } from "../host/host.model";
import { deleteModel } from "@typegoose/typegoose";



@Injectable()
export class ReportService extends BaseService<Report, Report> {
    private REPORT_SUFFIX: string = "_stalker_report.md";
    private content: string;
    private programSubdomainsMarkdown: string;
    private programMarkdown: string;
    private programSummaryArray: string[];
    private subdomainSummaryArray: string[];
    private subdomainTableHeader: string = `
|IP Address|Ports|Identified Services|
|----------|-----|-------------------|\n`;
    private programTableHeader: string = `
|Domain Name|IP Address|Identified Services|
|-----------|----------|-------------------|\n`;


    constructor(@InjectModel("report") private readonly reportModel: Model<Report>,
            private keybaseService: KeybaseService) {
        super(reportModel);
    }

    /** 
     * Gives the name of the current report, which is today's report. It is likely not fully completed.
     * @returns Date string in format "YYYY-MM-DD_stalker_report.md"
     * */
    public getCurrentReportName(): string {
        return this.getCurrentReportPrefix() + this.REPORT_SUFFIX;
    }

    /** 
     * Gives the prefix to the name of the last fully completed report, which is the report from yesterday
     * @returns Date string in format "YYYY-MM-DD"
     * */
    private getCurrentReportPrefix(): string {
        return new Date().toISOString().slice(0, 10);
    }

    /** 
     * Gives the name of the last fully completed report, which is the report from yesterday
     * @returns Date string in format "YYYY-MM-DD_stalker_report.md"
     * */
    public getLastReportName(): string {
        return this.getLastReportPrefix() + this.REPORT_SUFFIX;
    }

    /** 
     * Gives the prefix to the name of the last fully completed report, which is the report from yesterday
     * @returns Date string in format "YYYY-MM-DD"
     * */
    private getLastReportPrefix(): string {
        let today = new Date();
        let yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().slice(0, 10);
    }

    private getNextReportPrefix(): string {
        let today = new Date();
        let tommorow = new Date(today);
        tommorow.setDate(tommorow.getDate() + 1);
        return tommorow.toISOString().slice(0, 10);
    }

    public async addSpecialNote(dto: ReportEntryDto) {
        let report = await this.getCurrentReport();
        if (!report.notes) {
            report.notes = [];
        }
        report.notes.push(dto.noteContent);
        this.updateReport(report);
    }

    /** Adds new domains and subdomains to the daily report
     * @param programName The name of the program to which the domains and subdomains belong
     * @param domains A string array of the new domains and subdomains, like ["example.com", "sub1.example.com", "sub2.example.com", "sub3.sub1.example.com"]
     */
    public async addNewDomains(programName: string, domains: string[]): Promise<void> {
        let report: Report = await this.getCurrentReport();
        if (report.programs) {
            let program: Program; 
            report.programs.forEach(p => {
                if (p.name === programName) {
                    program = p;
                }
            });

            if (!program) {
                program = new Program();
                program.name = programName;
                report.programs.push(program);
            }
            domains.forEach(d => {
                DomainTreeUtils.growDomainTree(program, d);
            });
        } else {
            report.programs = [];
            let program = new Program();
            program.name = programName;
            report.programs.push(program);
            domains.forEach(d => {
                DomainTreeUtils.growDomainTree(program, d);
            });
        }
        this.updateReport(report);
    }

    private createHostsInDomainWithIps(domain: Domain, ips: string[]) {
        domain.hosts = [];
        ips.forEach(ip => {
            let host = new Host();
            host.ip = ip;
            domain.hosts.push(host);
        });
    }

    private createDomainTreeWithIps(program: Program, domainName: string, ips: string[]): void {
        DomainTreeUtils.growDomainTree(program, domainName);
        let domain: Domain = DomainTreeUtils.findDomainObject(program, domainName);
        this.createHostsInDomainWithIps(domain, ips);
    }
    

    private createProgramWithIps(programName: string, domainName: string, ips: string[]): Program {
        let program: Program = new Program();
        program.name = programName;
        this.createDomainTreeWithIps(program, domainName, ips);
        return program;
    }

    public async addNewHosts(programName: string, domainName: string, ips: string[]): Promise<void> {
        let report = await this.getCurrentReport();
        let program: Program; 
        let domain: Domain;

        // The program array already exists
        if (report.programs) {
            
            report.programs.forEach(p => {
                // Our program already exists
                if (p.name === programName) {
                    program = p;
                    domain = DomainTreeUtils.findDomainObject(program, domainName);
                    // The domain already exists
                    if (domain) {
                        // Host array exists
                        if(domain.hosts) {
                            let hostFound = false;
                            ips.forEach(ip => {
                                // Our ip is not contained in the hosts already there
                                if (!domain.hosts.some(host => host.ip === ip )) {
                                    let host = new Host();
                                    host.ip = ip;
                                    domain.hosts.push(host);
                                }
                            });
                        } else {
                            this.createHostsInDomainWithIps(domain, ips);
                        }
                        
                    } else { // The program was found, but it contained no domain tree or our domain did not exist
                        this.createDomainTreeWithIps(program, domainName, ips);
                    }
                }
            });
            // If our program was not found, then we create everything
            if (!program) {
                report.programs.push(this.createProgramWithIps(programName, domainName, ips));
            }
        } else { // The programs array did not exist in the report, so we create everything
            report.programs = [];
            report.programs.push(this.createProgramWithIps(programName, domainName, ips));
        }
        this.updateReport(report);
    }

    public async getCurrentReport(): Promise<Report> {
        let date = this.getCurrentReportPrefix();
        let currentReport: Report = await this.findOne({ date: date });
        if(!currentReport) {
            currentReport = await this.create({ date: date });
        }
        return currentReport;
    }

    public async updateReport(report: Report): Promise<void> {
        await this.update({ date: report.date }, report);
    }

    // Validates that there is an entry for the current report in the database 5 seconds after application startup
    @Timeout(5000)
    public async validateCurrentReportExists(): Promise<void> {
        let date = this.getCurrentReportPrefix();
        let currentReport: Report = await this.findOne({ date: date });
        if(!currentReport) {
            this.create({ date: date });
        }
    }
    
    @Cron(CronExpression.EVERY_DAY_AT_11PM, {
        name: 'daily_report_keybase',
        timeZone: 'America/Toronto',
    })
    public initializeNextReport(): void {
        this.create({ date:  this.getNextReportPrefix() });
    }

    /** Creates the report file saved on the disk to be sent by alerting services like the KeybaseService */
    private createReportFile(report: Report, date: string = ""): string {
        let reportName: string;
        if(date) {
            reportName = "/tmp/" + date + this.REPORT_SUFFIX;
        } else {
            reportName = "/tmp/" + this.getLastReportName();
            date = this.getLastReportPrefix();
        }

        // TODO: Create the report file with nice markdown content

        this.content = `# Stalker - Recon Automation | Daily Report

This report contains anything new that was found on the following date: 

**${date}**

Information in this report was unknown to Stalker before that date.\n\n`;

        if (report.notes) {
            this.content += "## Special Notes\n\n";
            report.notes.forEach(note => {
                this.content += `* ${note}`;
            });
            this.content += "\n\n";
        }

        

        if (report.programs) {
            report.programs.forEach(program => {
                this.programMarkdown = `## ${program.name}\n`;
                this.programMarkdown += this.programTableHeader;
                this.programSubdomainsMarkdown = "";

                if (program.domains) {
                    program.domains.forEach(domain => {
                        this.createMarkdownStringsFromTree(domain);
                    });
                }

                this.content += this.programMarkdown + "\n";
                this.content += this.programSubdomainsMarkdown;
            });
        }

        writeFileSync(reportName, this.content);
        
        return reportName;
    }


    private createMarkdownStringsFromTree(domain: Domain, currentParents: string = ""): void {
        
        /////////////////////////////////////////////////
        // Create program summary markdown string
        // |Domain Name|IP|Services|
        /////////////////////////////////////////////////
        // Create subdomain summary mardown string
        // |IP|Ports|Services|
        this.programMarkdown += currentParents ? `|${domain.name}.${currentParents}|` : `|${domain.name}|`;
        this.programSubdomainsMarkdown += currentParents ? `### ${domain.name}.${currentParents}\n` : `### ${domain.name}\n`;
        this.programSubdomainsMarkdown += this.subdomainTableHeader;
        
        if (domain.hosts) {
            let ipString = "";
            domain.hosts.forEach(host => {
                ipString += `${host.ip}, `;
                this.programSubdomainsMarkdown += `|${host.ip}|`;
                if (host.ports) {
                    let portString= "";
                    host.ports.forEach(port => {
                        portString += `${port}, `;
                    });
                    if (portString.length >= 2) {
                        portString = portString.substring(0, portString.length - 2);
                    }
                }
                this.programSubdomainsMarkdown += "||\n";
                // TODO: List the services in the markdown to be in the report, maybe do it only if there are ports? will likely depend on chosen structure
            });
            this.programSubdomainsMarkdown += "\n";
            if (ipString.length >= 2) {
                ipString = ipString.substring(0, ipString.length - 2);
            }
            this.programMarkdown += `${ipString}||\n`;
        } else {
            this.programMarkdown += "||\n";
            this.programSubdomainsMarkdown += "\n";
        }
        /////////////////////////////////////////////////

        if (domain.subdomains) {
            domain.subdomains.forEach(subdomain => {
                this.createMarkdownStringsFromTree(subdomain, `${domain.name}.${currentParents}`);
            });
        }
    }


    // https://docs.nestjs.com/techniques/task-scheduling
    // Use the keybase service
    @Cron(CronExpression.EVERY_DAY_AT_8AM, {
        name: 'daily_report_keybase',
        timeZone: 'America/Toronto',
    })
    public async sendDailyReport() {
        let date = this.getLastReportPrefix();
        this.sendReport(date);
    }

    public async sendReport(date: string): Promise<void> {
        let lastReport: Report = await this.findOne({ date: date });
        if (lastReport) {
            if (lastReport.programs || lastReport.notes) {
                let reportName = this.createReportFile(lastReport, date);
                this.keybaseService.sendReportFile(reportName);
            } else {
                // Send a message saying that there was a report, but nothing new
                this.keybaseService.sendSimpleAlertMessage("Good news, everyone! There is nothing to report. Have a nice day.");
            }
            await this.remove({ date: date });
        } else {
            // Send a message saying that there was no report and I don't know why
            this.keybaseService.sendSimpleAlertMessage("No report for yesterday was found! Take a day off, apparently I did.");
        }
    }
}