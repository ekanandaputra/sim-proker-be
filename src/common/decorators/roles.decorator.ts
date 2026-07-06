import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles are allowed to access an endpoint.
 * @example @Roles(Role.ADMIN, Role.UNIT_ADMIN)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
