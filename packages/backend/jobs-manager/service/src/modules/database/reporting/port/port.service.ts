import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../../exceptions/http.exceptions';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { Host, HostDocument } from '../host/host.model';
import { WebsiteService } from '../websites/website.service';
import { PortSearchQuery } from './port-search-query';
import { BatchEditPortsDto, GetPortsDto } from './port.dto';
import { Port, PortDocument } from './port.model';

@Injectable()
export class PortService {
  private logger = new Logger(PortService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    private tagsService: TagsService,
    @InjectModel('port') private readonly portsModel: Model<Port>,
    private readonly websiteService: WebsiteService,
    private readonly portSearchQuery: PortSearchQuery,
  ) {}

  private readonly hostNotFoundError = 'Invalid host and project combination.';
  private readonly badProtocolError = 'Protocol must be either "tcp" or "udp"';

  /**
   *
   * @param ip
   * @param projectId
   * @param portNumber
   * @param protocol
   * @returns The added port if added, null if the port was a duplicate
   */
  public async addPortByIp(
    ip: string,
    projectId: string,
    portNumber: number,
    protocol: 'tcp' | 'udp',
    service: string = undefined,
  ) {
    const host: Pick<HostDocument, '_id' | 'ip'> = await this.hostModel.findOne(
      {
        ip: { $eq: ip },
        projectId: { $eq: new Types.ObjectId(projectId) },
      },
      '_id ip',
    );
    if (!host) throw new HttpNotFoundException(this.hostNotFoundError);
    const correlationKey = CorrelationKeyUtils.portCorrelationKey(
      projectId,
      host.ip,
      portNumber,
      protocol,
    );
    return this.addPortToValidProjectHost(
      host,
      projectId,
      portNumber,
      protocol,
      correlationKey,
      service,
    );
  }

  /**
   *
   * @param hostId
   * @param projectId
   * @param portNumber
   * @param protocol
   * @returns The added port if added, null if the port was a duplicate
   */
  public async addPort(
    hostId: string,
    projectId: string,
    portNumber: number,
    protocol: 'tcp' | 'udp',
  ) {
    const host: Pick<HostDocument, '_id' | 'ip'> = await this.hostModel.findOne(
      {
        _id: { $eq: new Types.ObjectId(hostId) },
        projectId: { $eq: new Types.ObjectId(projectId) },
      },
      '_id ip',
    );
    if (!host) throw new HttpNotFoundException(this.hostNotFoundError);
    const correlationKey = CorrelationKeyUtils.portCorrelationKey(
      projectId,
      host.ip,
      portNumber,
      protocol,
    );
    return await this.addPortToValidProjectHost(
      host,
      projectId,
      portNumber,
      protocol,
      correlationKey,
    );
  }

  private async addPortToValidProjectHost(
    validHost: Pick<HostDocument, '_id' | 'ip'>,
    validProjectId: string,
    portNumber: number,
    protocol: string,
    correlationKey: string,
    service: string = undefined,
  ) {
    if (!(protocol === 'tcp' || protocol === 'udp'))
      throw new HttpBadRequestException(this.badProtocolError);
    if (!(portNumber >= 1 && portNumber <= 65535))
      throw new HttpBadRequestException(
        'Port number must be between 1 and 65535',
      );
    const port = new Port();
    port.port = portNumber;
    port.projectId = new Types.ObjectId(validProjectId);
    port.host = {
      id: new Types.ObjectId(validHost._id),
      ip: validHost.ip,
    };
    port.layer4Protocol = protocol;
    port.correlationKey = correlationKey;
    port.tags = [];

    let res: PortDocument = null;

    // Does not need to be awaited.
    // Updating the lastSeen timestamp as, when we see a port, we see its host
    this.hostModel
      .updateOne(
        { _id: { $eq: new Types.ObjectId(validHost._id) } },
        { lastSeen: Date.now() },
      )
      .exec();

    let setter =
      service === undefined
        ? { lastSeen: Date.now() }
        : { lastSeen: Date.now(), service: service };

    res = await this.portsModel.findOneAndUpdate(
      {
        port: { $eq: port.port },
        'host.id': { $eq: port.host.id },
        layer4Protocol: { $eq: port.layer4Protocol },
      },
      {
        $set: setter,
        $setOnInsert: port,
      },
      { upsert: true, new: true },
    );

    return res;
  }

  /**
   * Gets all the ports of a host in an undefined order.
   * @param hostId
   * @param page
   * @param pageSize
   * @param protocol "tcp", "udp" or null for both tcp and udp
   * @returns
   */
  public async getHostPorts(
    hostId: string,
    page: number = null,
    pageSize: number = null,
    protocol: string | null = null,
  ): Promise<PortDocument[]> {
    if (!(protocol === 'tcp' || protocol === 'udp' || protocol === null))
      throw new HttpBadRequestException(this.badProtocolError);

    let protocolFilter = {};
    if (protocol === 'tcp' || protocol === 'udp')
      protocolFilter = { $eq: protocol };

    let query = this.portsModel.find({
      hostId: { $eq: new Types.ObjectId(hostId) },
      layer4Protocol: protocolFilter,
    });
    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  /**
   * Gets all the port numbers and protocol only of a host in an undefined order.
   * @param hostId
   * @param page
   * @param pageSize
   * @param filter
   * @returns
   */
  public async getPortNumbers(
    page: number = null,
    pageSize: number = null,
    filter: FilterQuery<Port> = null,
  ): Promise<PortDocument[]> {
    const projection = 'port layer4Protocol host';
    let query = this.portsModel.find(filter, projection);
    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async getPort(portId: string) {
    return await this.portsModel.findById(portId);
  }

  public async getHostPort(hostId: string, portNumber: number) {
    console.log(await this.portsModel.findOne());
    return await this.portsModel.findOne({
      'host.id': { $eq: new Types.ObjectId(hostId) },
      port: { $eq: portNumber },
    });
  }

  public async deleteAllForProject(projectId: string): Promise<DeleteResult> {
    return await this.portsModel.deleteMany({
      projectId: { $eq: new Types.ObjectId(projectId) },
    });
  }

  public async deleteAllForHost(hostId: string): Promise<DeleteResult> {
    return await this.portsModel.deleteMany({
      hostId: { $eq: new Types.ObjectId(hostId) },
    });
  }

  public async delete(portId: string): Promise<DeleteResult> {
    await this.websiteService.cleanUpFor(portId, 'port');
    return await this.portsModel.deleteOne({
      _id: { $eq: new Types.ObjectId(portId) },
    });
  }

  public async deleteMany(portIds: string[]): Promise<DeleteResult> {
    for (const id of portIds) await this.websiteService.cleanUpFor(id, 'port');

    return await this.portsModel.deleteMany({
      _id: { $in: portIds.map((pid) => new Types.ObjectId(pid)) },
    });
  }

  public async tagPort(
    portId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    const port = await this.portsModel.findById(portId);
    if (!port) throw new HttpNotFoundException();

    if (!isTagged) {
      return await this.portsModel.updateOne(
        { _id: { $eq: new Types.ObjectId(portId) } },
        { $pull: { tags: new Types.ObjectId(tagId) } },
      );
    } else {
      if (!(await this.tagsService.tagExists(tagId)))
        throw new HttpNotFoundException();

      return await this.portsModel.updateOne(
        { _id: { $eq: new Types.ObjectId(portId) } },
        { $addToSet: { tags: new Types.ObjectId(tagId) } },
      );
    }
  }

  /**
   *
   * @param ip
   * @param port
   * @param protocol
   * @param projectId
   * @param tagId Expects a valid tagId
   * @param isTagged
   * @returns
   */
  public async tagPortByIp(
    ip: string,
    port: number,
    protocol: string,
    projectId: string,
    tagId: string,
    isTagged: boolean,
  ): Promise<UpdateResult> {
    const query: FilterQuery<Port> = {
      ip: { $eq: ip },
      port: { $eq: port },
      protocol: { $eq: protocol },
      projectId: { $eq: new Types.ObjectId(projectId) },
    };
    if (!isTagged) {
      return await this.portsModel.updateOne(query, {
        $pull: { tags: new Types.ObjectId(tagId) },
      });
    } else {
      return await this.portsModel.updateOne(query, {
        $addToSet: { tags: new Types.ObjectId(tagId) },
      });
    }
  }

  public async getAll(
    page: number = null,
    pageSize: number = null,
    filter: Partial<GetPortsDto> = null,
  ): Promise<PortDocument[]> {
    const projection =
      filter.detailsLevel === 'number'
        ? '_id port layer4Protocol correlationKey'
        : undefined;

    let query;
    if (filter) {
      query = this.portsModel.find(
        await this.portSearchQuery.toMongoFilters(filter.query),
        projection,
      );
    } else {
      query = this.portsModel.find({}, projection);
    }

    if (page != null && pageSize != null) {
      query = query.skip(page * pageSize).limit(pageSize);
    }
    return await query;
  }

  public async count(filter: GetPortsDto = null) {
    if (!filter) {
      return await this.portsModel.estimatedDocumentCount();
    } else {
      return await this.portsModel.countDocuments(
        await this.portSearchQuery.toMongoFilters(filter.query),
      );
    }
  }

  public async batchEdit(dto: BatchEditPortsDto) {
    const update: Partial<Host> = {};
    if (dto.block || dto.block === false) update.blocked = dto.block;
    if (dto.block) update.blockedAt = Date.now();

    return await this.portsModel.updateMany(
      { _id: { $in: dto.portIds.map((v) => new Types.ObjectId(v)) } },
      update,
    );
  }

  public async keyIsBlocked(correlationKey: string): Promise<boolean> {
    const p = await this.portsModel.findOne(
      { correlationKey: { $eq: correlationKey } },
      'blocked',
    );

    return p && p.blocked;
  }
}
