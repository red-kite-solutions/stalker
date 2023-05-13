import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { AuthenticatedSocket } from '../../auth/authenticated-socket';

export interface JobOutputRequest {
  jobId: string;
}

export interface JobOutputResponse {
  timestamp: number;
  value: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'finding';
}

export interface JobStatusUpdate {
  status: 'success' | 'started';
  timestamp: number;
}

export class JobsSocketioClient {
  public readonly jobOutputResponse = 'JobOutputResponse';
  public readonly jobOutputRequest = 'JobOutputRequest';
  public readonly jobStatusUpdate = 'JobStatusUpdate';
  public socket: AuthenticatedSocket;

  public jobOutput: Observable<JobOutputResponse>;
  public jobStatus: Observable<JobStatusUpdate>;

  constructor(authService: AuthService) {
    this.socket = new AuthenticatedSocket(authService);
    this.jobOutput = this.socket.fromEvent<JobOutputResponse>(this.jobOutputResponse);
    this.jobStatus = this.socket.fromEvent<JobStatusUpdate>(this.jobStatusUpdate);
  }

  sendMessage(r: JobOutputRequest) {
    this.socket.emit(this.jobOutputRequest, r);
  }

  isConnected() {
    return this.socket.ioSocket.connected;
  }

  disconnect() {
    this.socket.disconnect();
  }
}
