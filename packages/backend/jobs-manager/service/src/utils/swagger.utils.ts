import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiDefaultResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Page } from '../types/page.type';

/**
 * Handles the generic Page type for the OpenAPI documentation
 * @param model
 * @returns
 */
export const ApiDefaultResponsePage = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(Page, model),
    ApiDefaultResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(Page) },
          {
            properties: {
              items: {
                type: 'array',
                items: {
                  allOf: [
                    {
                      type: 'object',
                      properties: {
                        _id: {
                          type: 'string',
                          example: '507f1f77bcf86cd799439011',
                        },
                      },
                      required: ['_id'],
                    },
                    { $ref: getSchemaPath(model) },
                  ],
                },
              },
            },
          },
        ],
      },
    }),
  );

/**
 * Decorator that documents a response as the given model extended with a required `_id: string`.
 * Works for a single object or an array of objects.
 *
 * Usage:
 *  @ApiDefaultResponseExtendModelId(ProductDto)            // single object
 *  @ApiDefaultResponseExtendModelId([ProductDto])          // array of objects
 */
export const ApiDefaultResponseExtendModelId = <
  TModel extends Type<unknown> | [Type<unknown>],
>(
  modelOrArray: TModel,
  extraProperty?: SchemaObject & Partial<ReferenceObject>,
) => {
  const isArray = Array.isArray(modelOrArray);
  const model = (
    isArray
      ? (modelOrArray as [Type<unknown>])[0]
      : (modelOrArray as Type<unknown>)
  ) as Type<unknown>;

  const properties: (SchemaObject & Partial<ReferenceObject>)[] = [
    {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
      },
      required: ['_id'],
    },
    { $ref: getSchemaPath(model) },
  ];

  if (extraProperty) properties.push(extraProperty);

  return applyDecorators(
    ApiExtraModels(model),
    ApiDefaultResponse({
      schema: isArray
        ? {
            type: 'array',
            items: {
              allOf: properties,
            },
          }
        : {
            allOf: properties,
          },
    }),
  );
};
