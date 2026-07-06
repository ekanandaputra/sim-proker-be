import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthIntegrationService } from '../services/auth-integration.service';
import { AuthUserDto, AuthUnitDto } from '../dto/auth-integration.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { Req } from '@nestjs/common';

@ApiTags('Auth Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthIntegrationController {
  constructor(private readonly authService: AuthIntegrationService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users from Auth Service' })
  @ApiResponse({ status: 200, type: [AuthUserDto] })
  async getUsers(@Req() req: Request) {
    const token = req.headers.authorization;
    return this.authService.getAllUsers(token);
  }

  @Get('units')
  @ApiOperation({ summary: 'Get all units from Auth Service' })
  @ApiResponse({ status: 200, type: [AuthUnitDto] })
  async getUnits(@Req() req: Request) {
    const token = req.headers.authorization;
    return this.authService.getAllUnits(token);
  }
}
