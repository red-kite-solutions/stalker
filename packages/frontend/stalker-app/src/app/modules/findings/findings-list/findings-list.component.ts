import { Component, Input } from '@angular/core';
import { BehaviorSubject, Observable, concatMap, scan, shareReplay, tap } from 'rxjs';
import { FindingsService } from '../../../api/findings/findings.service';
import { CustomFinding } from '../../../shared/types/finding/finding.type';
import { Page } from '../../../shared/types/page.type';

@Component({
  selector: 'findings-list',
  templateUrl: 'findings-list.component.html',
  styleUrls: ['./finding-list.component.scss'],
})
export class FindingsListComponent {
  private _correlationKey: string | undefined = undefined;
  public get correlationKey() {
    return this._correlationKey;
  }
  @Input() public set correlationKey(value: string | undefined) {
    this._correlationKey = value;
    this.initFindings();
  }

  private _filterFindingKeys: string[] = [];
  public get filterFindingKeys() {
    return this._filterFindingKeys;
  }

  @Input() public set filterFindingKeys(value: string[]) {
    this._filterFindingKeys = value;
  }

  public loadMoreFindings$: BehaviorSubject<null> = new BehaviorSubject(null);
  public isLoadingMoreFindings$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public findings$: Observable<Page<CustomFinding>> | null = null;

  constructor(private findingsService: FindingsService) {}

  public loadMoreFindings() {
    this.loadMoreFindings$.next(null);
  }

  private initFindings() {
    if (this._correlationKey == null) return;

    const correlationKey = this._correlationKey;

    this.findings$ = this.loadMoreFindings$.pipe(
      tap(() => this.isLoadingMoreFindings$.next(true)),
      scan((acc) => acc + 1, -1),
      concatMap((page) =>
        this.findingsService.getPage(page, 15, {
          targets: [correlationKey],
          findingDenyList: this._filterFindingKeys,
        })
      ),
      scan((acc, value) => {
        acc.items.push(...value.items);
        acc.totalRecords = value.totalRecords;
        return acc;
      }),
      tap(() => this.isLoadingMoreFindings$.next(false)),
      shareReplay(1)
    );
  }
}
