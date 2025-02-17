import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, Subject, combineLatest, debounceTime, filter, map, shareReplay, switchMap, tap } from 'rxjs';
import { FindingsService } from '../../../../api/findings/findings.service';
import { SharedModule } from '../../../../shared/shared.module';
import { Website } from '../../../../shared/types/websites/website.type';
import { TextMenuComponent } from '../../../../shared/widget/text-menu/text-menu.component';
import { FindingsModule } from '../../../findings/findings.module';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule,
    FindingsModule,
    MatTooltipModule,
    TextMenuComponent,
    FindingsModule,
  ],
  selector: 'app-website-overview',
  templateUrl: './website-overview.component.html',
  styleUrls: ['./website-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteOverviewComponent {
  public websiteSubject$: BehaviorSubject<Website | undefined> = new BehaviorSubject<Website | undefined>(undefined);
  public website$ = this.websiteSubject$.pipe(filter((w) => !!w));
  public _website!: Website;

  @Input()
  public set website(wsite: Website) {
    this.websiteSubject$.next(wsite);
    this._website = wsite;
  }

  public get website() {
    return this._website;
  }

  public sitemapFilterChange$ = new BehaviorSubject<string>('');
  public selectedEndpoint: string = '';
  public endpointLoading: boolean = false;
  public previewLoading: boolean = false;
  public selectedEndpoint$ = new Subject<string>();
  public endpointData$ = combineLatest([this.selectedEndpoint$, this.website$]).pipe(
    tap(() => {
      this.endpointLoading = true;
    }),
    debounceTime(200),
    switchMap(([endpoint, website]) => {
      this.selectedEndpoint = endpoint;
      return this.findingService.getLatestWebsiteEndpoint([website!.correlationKey], endpoint);
    }),
    tap(() => {
      this.endpointLoading = false;
    }),
    shareReplay(1)
  );

  public preview$ = this.website$.pipe(
    tap(() => {
      this.previewLoading = true;
    }),
    switchMap((website) => {
      return this.findingService.getLatestWebsitePreview([website!.correlationKey]);
    }),
    tap(() => {
      this.previewLoading = false;
    })
  );

  public sitemap$ = combineLatest([this.website$, this.sitemapFilterChange$]).pipe(
    map(([website, filter]) => {
      return website!.sitemap.filter((v) => v.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
    })
  );

  public linkCopied = false;
  public copyLink(path: string) {
    let url = this.website.url.endsWith('/')
      ? this.website.url.slice(0, this.website.url.length - 1)
      : this.website.url;

    url += path.startsWith('/') ? path : '/' + path;

    this.clipboard.copy(url);
    this.linkCopied = true;
    setTimeout(() => {
      this.linkCopied = false;
      this.cdr.detectChanges();
    }, 2000);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private findingService: FindingsService,
    private clipboard: Clipboard
  ) {}
}
