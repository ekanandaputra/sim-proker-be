import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

/**
 * Swagger decorator for paginated endpoints.
 * Generates the standard paginated response schema.
 */
export const ApiPaginatedResponse = <TModel extends Type>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              isSuccess: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Success' },
              data: {
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  pagination: {
                    properties: {
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      totalItems: { type: 'number', example: 100 },
                      totalPages: { type: 'number', example: 10 },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
