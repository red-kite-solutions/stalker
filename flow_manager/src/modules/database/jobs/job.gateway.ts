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

export class JobOutputResponse {
  constructor(private output: string[]) {}
}

@WebSocketGateway(3001, { cors: true })
export class JobOutputGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  socketChangeStreamMap = new Map<
    string,
    ChangeStream<any, ChangeStreamDocument<any>>
  >();

  constructor(private jobsService: JobsService) {}

  @SubscribeMessage('JobOutputRequest')
  listenForMessages(
    @MessageBody('jobId') jobId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!isMongoId(jobId)) {
      client.disconnect(true);
      return;
    }

    // Closing the current change stream if one was already up for this socket
    const cs = this.socketChangeStreamMap.get(client.id);
    if (cs) {
      cs.close();
    }

    // Registering for changes on the job document in mongo
    const changeStream = this.jobsService.watchForJobOutput(jobId);
    this.socketChangeStreamMap.set(client.id, changeStream);

    const next = (change: ChangeStreamDocument) => {
      if (change.operationType !== 'update') return;

      if (change.updateDescription.updatedFields) {
        for (const key of Object.keys(change.updateDescription.updatedFields)) {
          if (key.startsWith('output')) {
            client.emit(
              JobOutputResponse.name,
              new JobOutputResponse(
                change.updateDescription.updatedFields[key],
              ),
            );
          }
        }
      }
    };

    changeStream.on('change', next);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const changeStream = this.socketChangeStreamMap.get(client.id);
    if (changeStream) {
      changeStream.close();
      this.socketChangeStreamMap.delete(client.id);
    }
  }
}
