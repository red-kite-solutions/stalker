import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { isMongoId } from 'class-validator';
import { ChangeStream, ChangeStreamDocument } from 'mongodb';
import { Server, Socket } from 'socket.io';
import { Role } from '../../auth/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtSocketioGuard } from '../../auth/guards/jwt-socketio.guard';
import { RolesSocketioGuard } from '../../auth/guards/role-socketio.guard';
import { JobsService } from './jobs.service';

export class JobOutputResponse {
  constructor(private timestamp: number, private value: string) {}
}

export class JobStatusUpdate {
  constructor(private status: string, private timestamp: number) {}
}

@WebSocketGateway({ cors: true })
@UseGuards(JwtSocketioGuard, RolesSocketioGuard)
@Roles(Role.User)
export class JobOutputGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  socketChangeStreamMap = new Map<
    string,
    ChangeStream<any, ChangeStreamDocument<any>>
  >();

  constructor(private jobsService: JobsService) {}

  @SubscribeMessage('JobOutputRequest')
  async listenForMessages(
    @MessageBody('jobId') jobId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!isMongoId(jobId)) {
      client.disconnect(true);
      return;
    }

    if ((await this.jobsService.getById(jobId)) === null) {
      throw new WsException('Job not found.');
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
            // First output update event is an array, but not the next ones
            if (Array.isArray(change.updateDescription.updatedFields[key])) {
              for (const output of change.updateDescription.updatedFields[
                key
              ]) {
                client.emit(
                  JobOutputResponse.name,
                  new JobOutputResponse(output.timestamp, output.value),
                );
              }
            } else {
              client.emit(
                JobOutputResponse.name,
                new JobOutputResponse(
                  change.updateDescription.updatedFields[key].timestamp,
                  change.updateDescription.updatedFields[key].value,
                ),
              );
            }
          } else if (key === 'startTime') {
            client.emit(
              JobStatusUpdate.name,
              new JobStatusUpdate(
                'started',
                change.updateDescription.updatedFields[key],
              ),
            );
          } else if (key === 'endTime') {
            client.emit(
              JobStatusUpdate.name,
              new JobStatusUpdate(
                'success',
                change.updateDescription.updatedFields[key],
              ),
            );
          }
        }
      }
    };

    changeStream.on('change', next);

    // Validate that the job has not already gone through some states
    const job = await this.jobsService.getById(jobId);
    if (job.startTime) {
      client.emit(
        JobStatusUpdate.name,
        new JobStatusUpdate('started', job.startTime),
      );
    }
    if (job.endTime) {
      client.emit(
        JobStatusUpdate.name,
        new JobStatusUpdate('success', job.endTime),
      );
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const changeStream = this.socketChangeStreamMap.get(client.id);
    if (changeStream) {
      changeStream.close();
      this.socketChangeStreamMap.delete(client.id);
    }
  }
}
