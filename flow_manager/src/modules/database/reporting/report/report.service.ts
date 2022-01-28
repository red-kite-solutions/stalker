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
        |----------|-----|-------------------|`;
    private programTableHeader: string = `
        |Domain Name|IP Address|Identified Services|
        |-----------|----------|-------------------|`;


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
        // Add note to report file
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
    private createReportFile(report: Report): string {
        let reportName = "/tmp/" + this.getLastReportName();
        let date = this.getLastReportPrefix();

        // TODO: Create the report file with nice markdown content

        this.content = `# Stalker - Recon Automation | Daily Report

        This report contains anything new that was found on the following date: 

        ${date}

        Information in this report was unknown to Stalker before that date.

        `;

        if (report.notes) {
            this.content += "## Special Notes\n\n";
            report.notes.forEach(note => {
                this.content += `* ${note}`;
            });
            this.content += "\n\n";
        }

        

        if (report.programs) {
            report.programs.forEach(program => {
                this.programMarkdown = `## ${program.name}\n\n`;
                this.programMarkdown += this.programTableHeader;

                if (program.domains) {
                    program.domains.forEach(domain => {
                        this.createMarkdownStringsFromTree(domain);
                    });
                }

                this.content += this.programMarkdown;
                this.content += this.programSubdomainsMarkdown;
            });
        }


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
        this.programSubdomainsMarkdown += currentParents ? `### ${domain.name}.${currentParents}\n\n` : `### ${domain.name}\n\n`;
        this.programSubdomainsMarkdown += this.subdomainTableHeader;
        
        if (domain.hosts) {
            let ipString = "";
            this.programSubdomainsMarkdown += "|";
            domain.hosts.forEach(host => {
                ipString += `${host.ip}, `;
                this.programSubdomainsMarkdown += host.ip + "|";
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
        let lastReport: Report = await this.findOne({ date: date });
        if (lastReport) {
            if (lastReport.programs || lastReport.notes) {
                let reportName = this.createReportFile(lastReport);
                this.keybaseService.sendReportFile(reportName);
            } else {
                // Send a message saying that there was a report, but nothing new
                this.keybaseService.sendSimpleAlertMessage("Good news, everyone! There is nothing to report. Have a nice day.");
            }
        } else {
            // Send a message saying that there was no report and I don't know why
            this.keybaseService.sendSimpleAlertMessage("No report for yesterday was found! Take a day off, apparently I did.");
        }
    }
}