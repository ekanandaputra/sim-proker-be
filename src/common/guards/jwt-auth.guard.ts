import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { getAppConfig } from '@common/config';

export interface JwtPayload {
  userId: string;
  unitId: string;
  roles: string[];
  name: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.validateAuthToken(token);
      if (!payload) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Attach user payload to request
      (request as Request & { user: JwtPayload }).user = payload;
    } catch (error) {
      this.logger.warn(`Auth validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private async validateAuthToken(token: string): Promise<JwtPayload | null> {
    const baseUrl = getAppConfig().AUTH_SERVICE_URL;

    if (!baseUrl) {
      this.logger.warn("[authService] AUTH_SERVICE_URL is not set, skipping token validation");
      return null;
    }

    try {
      const url = `${baseUrl}/api/auth/validate`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          // "X-Service-Name": "sim-iku",
          // "X-Internal-Key": process.env.INTERNAL_SERVICE_KEY ?? "",
        },
      });

      if (!response.ok) {
        return null;
      }

      const body = await response.json() as { success: boolean; data: any };
      this.logger.debug(`[DEBUG AUTH_SERVICE RESPONSE] ${JSON.stringify(body)}`);
      
      try {
        require('fs').appendFileSync('/tmp/auth-debug.log', JSON.stringify(body.data) + '\n');
      } catch (e) {}

      if (!body.success || !body.data || (!body.data.userId && !body.data.id)) {
        // If data is nested under user, extract it
        if (body.data && body.data.user && (body.data.user.userId || body.data.user.id)) {
            body.data = body.data.user;
        } else {
            return null;
        }
      }

      // Map id to userId if needed
      const validatedUserId = body.data.userId || body.data.id;

      // Since the validate endpoint might now return roles as an array of objects, we extract them
      let roles: string[] = [];
      let unitId = body.data.unitId || '';
      let name = body.data.name || '';

      if (body.data.roles && Array.isArray(body.data.roles)) {
        roles = body.data.roles.flatMap((roleItem: any) => {
          if (typeof roleItem === 'string') return [roleItem];
          const extracted = [];
          if (roleItem.key) extracted.push(roleItem.key);
          if (roleItem.name) extracted.push(roleItem.name);
          if (roleItem.role) extracted.push(roleItem.role);
          return extracted;
        }).filter(Boolean);
      } else if (body.data.role) {
         roles = typeof body.data.role === 'string' 
           ? [body.data.role] 
           : [body.data.role.key || body.data.role.name || ''].filter(Boolean);
      }
      
      // Fallback: Try to decode JWT if no roles found
      if (roles.length === 0) {
        try {
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const decodedStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
            const decodedPayload = JSON.parse(decodedStr);
            
            if (decodedPayload.roles && Array.isArray(decodedPayload.roles)) {
              roles = decodedPayload.roles.flatMap((r: any) => {
                if (typeof r === 'string') return [r];
                return [r.key, r.name, r.role].filter(Boolean);
              });
            } else if (decodedPayload.role) {
              roles = typeof decodedPayload.role === 'string' 
                ? [decodedPayload.role] 
                : [decodedPayload.role.key || decodedPayload.role.name || ''].filter(Boolean);
            }
            
            unitId = unitId || decodedPayload.unitId || '';
            name = name || decodedPayload.name || '';
          }
        } catch (e) {
          this.logger.warn('Failed to decode JWT payload to extract roles');
        }
      }

      const payload: JwtPayload = {
        userId: validatedUserId,
        unitId: unitId,
        roles: roles,
        name: name,
      };

      return payload;
    } catch (err) {
      this.logger.error(`[authService] Error validating token:`, err);
      return null;
    }
  }
}
