import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
  HttpNotImplementedException,
} from '../../../../exceptions/http.exceptions';
import { getTopTcpPorts } from '../../../../utils/ports.utils';
import { TagsService } from '../../tags/tag.service';
import { CorrelationKeyUtils } from '../correlation.utils';
import { Host } from '../host/host.model';
import { Port, PortDocument } from './port.model';

@Injectable()
export class PortService {
  private logger = new Logger(PortService.name);

  constructor(
    @InjectModel('host') private readonly hostModel: Model<Host>,
    private tagsService: TagsService,
    @InjectModel('port') private readonly portsModel: Model<Port>,
  ) {}

  private readonly hostNotFoundError = 'Invalid host and company combination.';
  private readonly badProtocolError = 'Protocol must be either "tcp" or "udp"';

  public async addPortByIp(
    ip: string,
    companyId: string,
    portNumber: number,
    protocol: string,
  ) {
    const host = await this.hostModel.findOne({
      ip: { $eq: ip },
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
    if (!host) throw new HttpNotFoundException(this.hostNotFoundError);
    const correlationKey = CorrelationKeyUtils.portCorrelationKey(
      companyId,
      host.ip,
      portNumber,
      protocol,
    );
    return this.addPortToValidCompanyHost(
      host._id.toString(),
      companyId,
      portNumber,
      protocol,
      correlationKey,
    );
  }

  public async addPort(
    hostId: string,
    companyId: string,
    portNumber: number,
    protocol: string,
  ) {
    const host = await this.hostModel.findOne({
      _id: { $eq: hostId },
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
    if (!host) throw new HttpNotFoundException(this.hostNotFoundError);
    const correlationKey = CorrelationKeyUtils.portCorrelationKey(
      companyId,
      host.ip,
      portNumber,
      protocol,
    );
    return await this.addPortToValidCompanyHost(
      hostId,
      companyId,
      portNumber,
      protocol,
      correlationKey,
    );
  }

  private async addPortToValidCompanyHost(
    validHostId: string,
    validCompanyId: string,
    portNumber: number,
    protocol: string,
    correlationKey: string,
  ) {
    if (!(protocol === 'tcp' || protocol === 'udp'))
      throw new HttpBadRequestException(this.badProtocolError);
    if (!(portNumber >= 1 && portNumber <= 65535))
      throw new HttpBadRequestException(
        'Port number must be between 1 and 65535',
      );
    const port = new Port();
    port.port = portNumber;
    port.companyId = new Types.ObjectId(validCompanyId);
    port.hostId = new Types.ObjectId(validHostId);
    port.layer4Protocol = protocol;
    port.correlationKey = correlationKey;
    port.tags = [];

    return await this.portsModel.create(port);
  }

  /**
   * Gets the top TCP ports for a host according to nmap's top ports list.
   * Prioritizes up to 100 ports and then returns the requested slice. Returns up to 100 ports.
   *
   * Most likely slower than `getHostPorts`, so if port priority is not important,
   * do not use this function, use `getHostPorts` instead
   * @param hostId
   * @param page
   * @param pageSize
   * @param detailsLevel
   * @returns A list of max 100 ordered ports by usage statistics
   */
  public async getHostTopTcpPorts(
    hostId: string,
    page: number,
    pageSize: number,
    detailsLevel: string,
  ) {
    const detailsFilter = this.getDetailsFilter(detailsLevel);
    let ports = await this.portsModel.find(
      {
        hostId: { $eq: new Types.ObjectId(hostId) },
        layer4Protocol: 'tcp',
      },
      detailsFilter,
    );
    const max = page * pageSize + pageSize;
    const topPorts: Port[] = getTopTcpPorts(ports, max);
    return topPorts.slice(page * pageSize, max);
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

  public async getPort(portId: string) {
    return await this.portsModel.findById(portId);
  }

  private getDetailsFilter(detailsLevel: string) {
    const portsLevelFilter = { port: 1, layer4Protocol: 1, correlationKey: 1 };
    if (detailsLevel === 'full') return {};
    else if (detailsLevel === 'number') return portsLevelFilter;
    else if (detailsLevel === 'summary')
      throw new HttpNotImplementedException();
    return portsLevelFilter;
  }

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
    return await this.portsModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }

  public async deleteAllForHost(hostId: string): Promise<DeleteResult> {
    return await this.portsModel.deleteMany({
      hostId: { $eq: new Types.ObjectId(hostId) },
    });
  }

  public async delete(portId: string): Promise<DeleteResult> {
    return await this.portsModel.deleteOne({
      _id: { $eq: new Types.ObjectId(portId) },
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
}
