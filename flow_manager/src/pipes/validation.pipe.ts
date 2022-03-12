import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ObjectUtils } from '../utils/object.utils';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor(private groups: string[] = []) {}

  async transform(value, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Patch for uploading files. Uploading files requires to use form-data instead of application/json and it seems
    // like the value object is not being created properly which results in the request being rejected. In that case
    // we use the rebuildObjectIfBroken method to make sure the value is sane. This method does not work on deep
    // data structures. RIP my last hour of debugging.
    // The problem comes from multer (which parses the form-data)
    // https://github.com/expressjs/multer/blob/master/lib/make-middleware.js#L28
    // Works when line 28 is: req.body = {}
    const object = plainToClass(
      metatype,
      ObjectUtils.rebuildObjectIfBroken(value),
    );
    const groups = this.getGroups(value);
    const errors = await validate(object, {
      groups,
    });
    if (errors.length > 0) {
      throw new HttpException(
        { message: 'Validation failed', fields: errors.map((e) => e.property) },
        HttpStatus.PRECONDITION_FAILED,
      );
    }
    return value;
  }

  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find((type) => metatype === type);
  }

  private getGroups(value) {
    return this.groups.filter((x) => x in value).map((x) => value[x]);
  }
}
