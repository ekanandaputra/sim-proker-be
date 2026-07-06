import { z } from 'zod';

export const appConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  AUTH_SERVICE_URL: z.string().url(),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = appConfigSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${(messages ?? []).join(', ')}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${errorMessages}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}
