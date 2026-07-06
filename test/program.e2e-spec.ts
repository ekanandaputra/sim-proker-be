import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '@common/interceptors';
import { GlobalExceptionFilter } from '@common/filters';

/**
 * E2E test example for Program CRUD.
 *
 * NOTE: This test requires a running PostgreSQL database.
 * Run `docker compose up -d` before executing E2E tests.
 *
 * To run: pnpm test:e2e
 */
describe('Program E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  /**
   * Note: Full E2E tests would use supertest or similar HTTP testing library.
   * Example test structure:
   *
   * it('GET /api/v1/programs should return paginated programs', async () => {
   *   const response = await request(app.getHttpServer())
   *     .get('/api/v1/programs')
   *     .set('Authorization', `Bearer ${testJwtToken}`)
   *     .expect(200);
   *
   *   expect(response.body.isSuccess).toBe(true);
   *   expect(response.body.data.items).toBeInstanceOf(Array);
   *   expect(response.body.data.pagination).toBeDefined();
   * });
   */
});
