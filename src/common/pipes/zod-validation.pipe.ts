import { PipeTransform, BadRequestException, Injectable } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic Zod validation pipe.
 * Usage: @UsePipes(new ZodValidationPipe(schema))
 * Or:    @Body(new ZodValidationPipe(schema))
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        isSuccess: false,
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }

  private formatErrors(error: ZodError): Array<{ field: string; message: string }> {
    return error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }
}
