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
  public readonly jobOutputResponse = 'JobOutputResponse';
  public readonly jobOutputRequest = 'JobOutputRequest';

  jobOutput = this.socket.fromEvent<JobOutputResponse>(this.jobOutputResponse);

  constructor(private socket: Socket) {}

  sendMessage(r: JobOutputRequest) {
    this.socket.emit(this.jobOutputRequest, r);
  }
}
