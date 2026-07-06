import { PaginationQuery, PaginatedResponse, PaginationMeta } from '@common/dto/pagination.dto';

/**
 * Build Prisma pagination args from a PaginationQuery.
 */
export function buildPaginationArgs(query: PaginationQuery): {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
} {
  const skip = (query.page - 1) * query.limit;
  const take = query.limit;

  const orderBy = query.sortBy
    ? { [query.sortBy]: query.sortOrder }
    : undefined;

  return { skip, take, orderBy };
}

/**
 * Build a paginated response from items and total count.
 */
export function buildPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  query: PaginationQuery,
): PaginatedResponse<T> {
  const pagination: PaginationMeta = {
    page: query.page,
    limit: query.limit,
    totalItems,
    totalPages: Math.ceil(totalItems / query.limit),
  };

  return { items, pagination };
}
