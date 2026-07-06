import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constant';
import { UnitService } from '../services/unit.service';

@ApiTags('Unit Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  private extractToken(req: Request): string {
    return req.headers.authorization || '';
  }

  @ApiOperation({ summary: 'Get all units (proxied to auth service)' })
  @Get()
  async getUnits(@Req() req: Request, @Query() query: any) {
    return this.unitService.getUnits(this.extractToken(req), query);
  }

  @ApiOperation({ summary: 'Get unit by ID' })
  @Get(':id')
  async getUnitById(@Req() req: Request, @Param('id') id: string) {
    return this.unitService.getUnitById(id, this.extractToken(req));
  }

  @ApiOperation({ summary: 'Create new unit' })
  @Roles(Role.ADMIN) // Assuming only admins can create units
  @Post()
  async createUnit(@Req() req: Request, @Body() payload: any) {
    return this.unitService.createUnit(payload, this.extractToken(req));
  }

  @ApiOperation({ summary: 'Update a unit' })
  @Roles(Role.ADMIN)
  @Put(':id')
  async updateUnit(@Req() req: Request, @Param('id') id: string, @Body() payload: any) {
    return this.unitService.updateUnit(id, payload, this.extractToken(req));
  }

  @ApiOperation({ summary: 'Delete a unit' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUnit(@Req() req: Request, @Param('id') id: string) {
    return this.unitService.deleteUnit(id, this.extractToken(req));
  }
}
