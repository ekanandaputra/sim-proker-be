import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { getAppConfig } from '@common/config';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: getAppConfig().LOG_LEVEL,
        transport:
          getAppConfig().NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        genReqId: (req) => {
          const existingId = req.headers['x-correlation-id'];
          return (existingId as string) ?? crypto.randomUUID();
        },
        customProps: () => ({
          service: 'sim-proker',
        }),
        autoLogging: true,
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
  ],
})
export class AppLoggerModule {}
