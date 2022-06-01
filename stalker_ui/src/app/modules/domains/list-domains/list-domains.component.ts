import { Component } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout/core';
import { MatTableDataSource } from '@angular/material/table';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { Domain } from 'src/app/shared/types/domain/domain.interface';

@Component({
  selector: 'app-list-domains',
  templateUrl: './list-domains.component.html',
  styleUrls: ['./list-domains.component.scss'],
})
export class ListDomainsComponent {
  displayedColumns: string[] = ['select', 'domain', 'hosts', 'company', 'tags'];

  // dataSource = new MatTableDataSource<Domain>();
  // dataSource$ = from([
  //   {
  //     _id: '62916d822e78ca0036253b6c',
  //     companyId: '62916d822e78ca0036253b6c',
  //     name: 'www.example.com',
  //     hosts: [
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //     ],
  //     tags: ['crown jewel', 'ssh', 'web'],
  //     notes: 'asdf',
  //   },
  //   {
  //     _id: '62916d822e78ca0036253b6c',
  //     companyId: '6291bd34e8f0cd0042385950',
  //     name: 'www.example.com',
  //     hosts: [
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //     ],
  //     tags: ['crown jewel', 'ssh', 'web'],
  //     notes: 'asdf',
  //   },
  //   {
  //     _id: '62916d822e78ca0036253b6c',
  //     companyId: '62916d822e78ca0036253b6c',
  //     name: 'www.example.com',
  //     hosts: [
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //     ],
  //     tags: ['crown jewel', 'ssh', 'web'],
  //     notes: 'asdf',
  //   },
  //   {
  //     _id: '62916d822e78ca0036253b6c',
  //     companyId: '6291bcb8e8f0cd0042385944',
  //     name: 'www.example.com',
  //     hosts: [
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //       {
  //         id: '6291bcb8e8f0cd0042385944',
  //         ip: '192.160.23.58',
  //       },
  //     ],
  //     tags: ['crown jewel', 'ssh', 'web'],
  //     notes: 'asdf',
  //   },
  // ]).pipe(
  //   map((a) => {
  //     if (!this.dataSource) {
  //       this.dataSource = new MatTableDataSource<Domain>();
  //     }
  //     this.dataSource.data.push(a);
  //     return this.dataSource;
  //   })
  // );

  dataSource = new MatTableDataSource<Domain>([
    {
      _id: '62916d822e78ca0036253b6c',
      companyId: '62916d822e78ca0036253b6c',
      name: 'www.example.com',
      hosts: [
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
      ],
      tags: ['crown jewel', 'ssh', 'web'],
      notes: 'asdf',
    },
    {
      _id: '62916d822e78ca0036253b6c',
      companyId: '6291bd34e8f0cd0042385950',
      name: 'www.example.com',
      hosts: [
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
      ],
      tags: ['crown jewel', 'ssh', 'web'],
      notes: 'asdf',
    },
    {
      _id: '62916d822e78ca0036253b6c',
      companyId: '62916d822e78ca0036253b6c',
      name: 'www.example.com',
      hosts: [
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
      ],
      tags: ['crown jewel', 'ssh', 'web'],
      notes: 'asdf',
    },
    {
      _id: '62916d822e78ca0036253b6c',
      companyId: '6291bcb8e8f0cd0042385944',
      name: 'www.example.com',
      hosts: [
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
        {
          id: '6291bcb8e8f0cd0042385944',
          ip: '192.160.23.58',
        },
      ],
      tags: ['crown jewel', 'ssh', 'web'],
      notes: 'asdf',
    },
  ]);
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
      if (screen === 'xs') return ['select', 'domain', 'hosts', 'company', 'tags'];
      if (screen === 'sm') return ['select', 'domain', 'hosts', 'company', 'tags'];
      if (screen === 'md') return ['select', 'domain', 'hosts', 'company', 'tags'];
      return this.displayedColumns;
    })
  );

  constructor(private mediaObserver: MediaObserver) {}
}
