import { applyDecorators } from '@nestjs/common';
import { ApiProduces, ApiResponse } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Documents a JSON response as returned to the client, i.e. wrapped by ResponseInterceptor:
 * `{ isSuccess: true, message: 'Success', data: <data> }`.
 */
export const ApiWrappedResponse = (options: {
  status?: number;
  description: string;
  data: SchemaObject;
}) =>
  ApiResponse({
    status: options.status ?? 200,
    description: options.description,
    schema: {
      type: 'object',
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: options.data,
      },
    },
  });

/** `data: { message: string }` — used by delete endpoints that echo a confirmation message. */
export const ApiMessageResponse = (message: string, status = 200) =>
  ApiWrappedResponse({
    status,
    description: message,
    data: {
      type: 'object',
      properties: { message: { type: 'string', example: message } },
    },
  });

/** `data: { success: true }`. */
export const ApiSuccessFlagResponse = (description: string, status = 200) =>
  ApiWrappedResponse({
    status,
    description,
    data: {
      type: 'object',
      properties: { success: { type: 'boolean', example: true } },
    },
  });

/** Import result: `data: { createdCount, skippedCount }`. */
export const ApiImportResultResponse = (description = 'Excel file imported successfully') =>
  ApiWrappedResponse({
    status: 201,
    description,
    data: {
      type: 'object',
      properties: {
        createdCount: { type: 'number', example: 10, description: 'Rows created' },
        skippedCount: {
          type: 'number',
          example: 2,
          description: 'Rows skipped (duplicate or invalid)',
        },
      },
    },
  });

/**
 * File download (sent raw, not wrapped): binary body plus Content-Disposition header, so Swagger UI
 * offers a download link.
 */
export const ApiFileResponse = (options: {
  mimeType?: string;
  fileName: string;
  description?: string;
}) => {
  const mimeType = options.mimeType ?? XLSX_MIME_TYPE;
  return applyDecorators(
    ApiProduces(mimeType),
    ApiResponse({
      status: 200,
      description: options.description ?? 'File siap diunduh',
      headers: {
        'Content-Disposition': {
          description: `attachment; filename="${options.fileName}"`,
          schema: { type: 'string' },
        },
      },
      content: { [mimeType]: { schema: { type: 'string', format: 'binary' } } },
    }),
  );
};
