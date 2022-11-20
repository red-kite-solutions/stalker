import { Component, TemplateRef } from "@angular/core";
import { MediaChange, MediaObserver } from "@angular/flex-layout/core";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ToastrService } from "ngx-toastr";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
} from "rxjs";
import { CompaniesService } from "src/app/api/companies/companies.service";
import { TagsService } from "src/app/api/tags/tags.service";
import { CompanySummary } from "src/app/shared/types/company/company.summary";
import { Page } from "src/app/shared/types/page.type";
import { Tag } from "src/app/shared/types/tag.type";
import { HostsService } from "../../../api/hosts/hosts.service";
import { Host } from "../../../shared/types/host/host.interface";

@Component({
  selector: "app-list-hosts",
  templateUrl: "./list-hosts.component.html",
  styleUrls: ["./list-hosts.component.scss"],
})
export class ListHostsComponent {
  dataLoading = true;
  displayedColumns: string[] = ["select", "ip", "domains", "company"];
  filterOptions: string[] = ["domain", "company"];

  dataSource = new MatTableDataSource<Host>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = [];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  count = 0;

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.hostsService.getPage(
        currentPage.pageIndex,
        currentPage.pageSize,
        filters
      );
    }),
    map((data: Page<Host>) => {
      if (!this.dataSource) {
        this.dataSource = new MatTableDataSource<Host>();
      }
      this.dataSource.data = data.items;
      this.count = data.totalRecords;
      this.dataLoading = false;
      return data;
    })
  );

  companies: CompanySummary[] = [];
  companies$ = this.companiesService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: CompanySummary[] = [];
      for (const company of next) {
        comp.push({ id: company._id, name: company.name });
      }
      this.companies = comp;
      return this.companies;
    })
  );

  tags: Tag[] = [];
  tags$ = this.tagsService.getTags().pipe(
    map((next: any[]) => {
      const tagsArr: Tag[] = [];
      for (const tag of next) {
        tagsArr.push({ id: tag._id, text: tag.text, color: tag.color });
      }
      this.tags = tagsArr;
      return this.tags;
    })
  );

  // #addDomainDialog template variables
  selectedCompany = "";
  selectedNewDomains = "";

  private generateFirstPageEvent() {
    const p = new PageEvent();
    p.pageIndex = 0;
    p.pageSize = 10;
    this.currentPage = p;
    return p;
  }

  private screenSize$ = this.mediaObserver.asObservable().pipe(
    filter((mediaChanges: MediaChange[]) => !!mediaChanges[0].mqAlias),
    distinctUntilChanged((previous: MediaChange[], current: MediaChange[]) => {
      return previous[0].mqAlias === current[0].mqAlias;
    }),
    map((mediaChanges: MediaChange[]) => {
      return mediaChanges[0].mqAlias;
    })
  );

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: string) => {
      if (screen === "xs") return ["select", "domains", "company"];
      if (screen === "sm") return ["select", "domains", "company", "tags"];
      if (screen === "md") return ["select", "domains", "company", "tags"];
      return this.displayedColumns;
    })
  );

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
  }

  constructor(
    private mediaObserver: MediaObserver,
    private companiesService: CompaniesService,
    private hostsService: HostsService,
    private toastrService: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog
  ) {}

  filtersChange(filters: string[]) {
    this.currentFilters = filters;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
  }

  buildFilters(stringFilters: string[]): any {
    const SEPARATOR = ":";
    const filterObject: any = {};
    const tags = [];
    const domains = [];

    for (const filter of stringFilters) {
      if (filter.indexOf(SEPARATOR) === -1) continue;

      const keyValuePair = filter.split(SEPARATOR);

      if (keyValuePair.length !== 2) continue;

      const key = keyValuePair[0].trim().toLowerCase();
      const value = keyValuePair[1].trim().toLowerCase();

      if (!key || !value) continue;

      switch (key) {
        case "company":
          const company = this.companies.find(
            (c) => c.name.trim().toLowerCase() === value.trim().toLowerCase()
          );
          if (company) filterObject["company"] = company.id;
          else
            this.toastrService.warning(
              $localize`:Company does not exist|The given company name is not known to the application:Company name not recognized`
            );
          break;
        case "tags":
          const tag = this.tags.find(
            (t) => t.text.trim().toLowerCase() === value.trim().toLowerCase()
          );
          if (tag) tags.push(tag.id);
          else
            this.toastrService.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;
        case "domain":
          domains.push(value);
          break;
      }
    }
    if (tags) filterObject["tags"] = tags;
    if (domains) filterObject["domain"] = domains;
    return filterObject;
  }

  openNewDomainsDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: "50%",
    });
  }
}
