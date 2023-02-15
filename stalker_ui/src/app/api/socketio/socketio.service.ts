import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

export interface JobOutputRequest {
  jobId: string;
}

export interface JobOutputResponse {
  output: string[];
}

export interface JobStatusUpdate {
  status: 'success' | 'started';
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class SocketioService {
  public readonly jobOutputResponse = 'JobOutputResponse';
  public readonly jobOutputRequest = 'JobOutputRequest';
  public readonly jobStatusUpdate = 'JobStatusUpdate';

  jobOutput = this.socket.fromEvent<JobOutputResponse>(this.jobOutputResponse);
  jobStatus = this.socket.fromEvent<JobStatusUpdate>(this.jobStatusUpdate);

  constructor(private socket: Socket) {}

  sendMessage(r: JobOutputRequest) {
    this.socket.emit(this.jobOutputRequest, r);
  }
}
