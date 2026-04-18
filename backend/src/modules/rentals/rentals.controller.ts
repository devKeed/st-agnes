import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { RentalsService } from './rentals.service';
import { CreateRentalDto, QueryRentalsDto, UpdateRentalDto } from './dto';

@ApiTags('Rentals')
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List visible rental products (public)' })
  async listPublic(@Query() query: QueryRentalsDto) {
    return this.rentalsService.findAll(query, { isAdmin: false });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single rental by id (public)' })
  async getPublic(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rentalsService.findOne(id, { isAdmin: false });
  }

  @Get('admin/list')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Admin list — supports includeHidden=true to surface hidden/retired items.',
  })
  async listAdmin(
    @Query() query: QueryRentalsDto,
    @CurrentUser('role') _role: AdminRole,
  ) {
    return this.rentalsService.findAll(query, { isAdmin: true });
  }

  @Get('admin/:id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin detail — bypasses visibility checks.' })
  async getAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rentalsService.findOne(id, { isAdmin: true });
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create rental product (admin)' })
  async create(@Body() dto: CreateRentalDto) {
    return this.rentalsService.create(dto);
  }

  @Put(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update rental product (admin)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRentalDto,
  ) {
    return this.rentalsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Soft-delete rental product (admin) — sets status=RETIRED + isVisible=false.',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rentalsService.remove(id);
  }
}
