import { describe, it, expect } from 'vitest';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z.number().int().min(0, 'Age must be non-negative'),
    email: z.string().email('Invalid email'),
  });

  const pipe = new ZodValidationPipe(testSchema);

  it('should pass valid data through', () => {
    const input = { name: 'John', age: 30, email: 'john@example.com' };
    const result = pipe.transform(input);
    expect(result).toEqual(input);
  });

  it('should throw BadRequestException for invalid data', () => {
    const input = { name: '', age: -1, email: 'invalid' };
    expect(() => pipe.transform(input)).toThrow(BadRequestException);
  });

  it('should include field-level error details', () => {
    const input = { name: '', age: -1, email: 'invalid' };
    try {
      pipe.transform(input);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
      expect(response['isSuccess']).toBe(false);
      expect(response['message']).toBe('Validation failed');
      expect(response['errors']).toBeInstanceOf(Array);
      expect((response['errors'] as Array<unknown>).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should strip unknown fields', () => {
    const input = { name: 'John', age: 30, email: 'john@example.com', unknown: 'field' };
    const result = pipe.transform(input);
    expect(result).not.toHaveProperty('unknown');
  });
});
