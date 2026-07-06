import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiCreatedResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constant';
import { UnitService } from '../services/unit.service';
import { CreateUnitDto, UpdateUnitDto, AssignUnitPayloadDto } from '../dto/unit.dto';

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
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search query' })
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
  @ApiBody({ type: CreateUnitDto })
  @ApiCreatedResponse({
    description: 'The unit has been successfully created.',
    schema: {
      example: {
        isSuccess: true,
        message: 'Success',
        data: {
          id: 'e61aa77e-e4eb-480e-9366-4a7c3a217ccf',
          name: 'Unit B',
          description: 'Description for Unit A',
          createdAt: '2026-07-06T06:00:00.839Z',
          updatedAt: '2026-07-06T06:00:00.839Z'
        }
      }
    }
  })
  @Roles(Role.ADMIN) // Assuming only admins can create units
  @Post()
  async createUnit(@Req() req: Request, @Body() payload: CreateUnitDto) {
    return this.unitService.createUnit(payload, this.extractToken(req));
  }

  @ApiOperation({ summary: 'Update a unit' })
  @ApiBody({ type: UpdateUnitDto })
  @Roles(Role.ADMIN)
  @Put(':id')
  async updateUnit(@Req() req: Request, @Param('id') id: string, @Body() payload: UpdateUnitDto) {
    return this.unitService.updateUnit(id, payload, this.extractToken(req));
  }

  @ApiOperation({ summary: 'Delete a unit' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUnit(@Req() req: Request, @Param('id') id: string) {
    return this.unitService.deleteUnit(id, this.extractToken(req));
  }

  @ApiOperation({ summary: 'Assign users to a unit' })
  @ApiBody({ type: AssignUnitPayloadDto })
  @Roles(Role.ADMIN)
  @Post(':id/assign')
  async assignUsers(@Req() req: Request, @Param('id') id: string, @Body() payload: AssignUnitPayloadDto) {
    return this.unitService.assignUsers(id, payload, this.extractToken(req));
  }
}
