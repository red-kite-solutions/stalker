import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

export interface JobOutputRequest {
  jobId: string;
}

export interface JobOutputResponse {
  output: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SocketioService {
  public readonly jobOutputResponse = 'JobOutputRes';
  public readonly jobOutputRequest = 'JobOutputReq';

  jobOutput = this.socket.fromEvent<JobOutputResponse>(this.jobOutputResponse);

  constructor(private socket: Socket) {}

  sendMessage(r: JobOutputRequest) {
    console.log(`sending job ${r.jobId}`);
    this.socket.emit(this.jobOutputRequest, r);
  }
}
