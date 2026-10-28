import { describe, expect, it, vi } from 'vitest';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AuthIntegrationService } from './auth-integration.service';

vi.mock('@common/config', () => ({
  getAppConfig: () => ({ AUTH_SERVICE_URL: 'http://auth.test' }),
}));

const users = [{ id: 'user-1', name: 'Budi', nip: '00198001012005011001' }];
const pagination = { page: 2, limit: 100, total: 201, totalPages: 3 };
const query = { page: 2, limit: 100, sortOrder: 'asc' as const };

function serviceFor(data: unknown) {
  return new AuthIntegrationService({ get: vi.fn(() => of({ data })) } as unknown as HttpService);
}

describe('AuthIntegrationService user pagination', () => {
  it.each([
    { success: true, data: users, pagination },
    { success: true, data: { data: users, pagination } },
  ])('preserves pagination metadata for supported response formats: %j', async (response) => {
    expect(await serviceFor(response).getAllUsers('Bearer token', query)).toEqual({
      items: users,
      pagination: { page: 2, limit: 100, totalItems: 201, totalPages: 3 },
    });
  });

  it('preserves zero totals for an empty page', async () => {
    const result = await serviceFor({ data: [], pagination: { ...pagination, total: 0, totalPages: 0 } }).getAllUsers(undefined, query);
    expect(result.pagination).toEqual({ page: 2, limit: 100, totalItems: 0, totalPages: 0 });
  });

  it.each([users, { data: users }, { data: { data: users } }])('keeps responses without metadata on a single page: %j', async (response) => {
    const result = await serviceFor(response).getAllUsers(undefined, { ...query, limit: 1 });
    expect(result).toEqual({ items: users, pagination: { page: 2, limit: 1, totalItems: 1, totalPages: 1 } });
  });
});
