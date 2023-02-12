import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { isMongoId } from 'class-validator';
import { ChangeStream, ChangeStreamDocument } from 'mongodb';
import { Server, Socket } from 'socket.io';
import { JobsService } from './jobs.service';
import { JobDocument } from './models/custom-job.model';

@WebSocketGateway(3001, { cors: true })
export class JobOutputGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  socketChangeStreamMap = new Map<
    string,
    ChangeStream<any, ChangeStreamDocument<any>>
  >();

  constructor(private jobsService: JobsService) {}

  @SubscribeMessage('JobOutputReq')
  listenForMessages(
    @MessageBody('jobId') jobId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Subscribing to job id : ${jobId}`);
    if (!isMongoId(jobId)) {
      client.disconnect(true);
      return;
    }

    console.log('mongo id true');

    // Closing the current change stream if one was already up for this socket
    const cs = this.socketChangeStreamMap.get(client.id);
    if (cs) {
      cs.close();
    }

    // Registering for changes on the job document in mongo
    const changeStream = this.jobsService.watchForJobOutput(jobId);
    const next = (job: Partial<JobDocument>) => {
      console.log('COUCOU :)');
      console.log(job);
      client.emit('JobOutputRes', job);
    };
    this.socketChangeStreamMap.set(client.id, changeStream);
    // changeStream.eventNames()
    changeStream.on('change', next);
    console.log('end of call');
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`disconnecting client ${client.id}`);
    const changeStream = this.socketChangeStreamMap.get(client.id);
    if (changeStream) {
      changeStream.close();
      this.socketChangeStreamMap.delete(client.id);
    }
  }
}
