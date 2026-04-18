import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Public, Roles } from '../../common/decorators';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  QueryBookingsDto,
  RescheduleBookingDto,
  UpdateBookingStatusDto,
} from './dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ─── Public ──────────────────────────────────────────────────────────────────

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new booking (public)' })
  async create(@Body() dto: CreateBookingDto) {
    const { booking, manageUrl } = await this.bookingsService.create(dto);
    return {
      id: booking.id,
      status: booking.status,
      manageToken: booking.manageToken,
      manageUrl,
      startTime: booking.startTime,
      endTime: booking.endTime,
      serviceType: booking.serviceType,
      message: 'Booking confirmed. Check your email for details.',
    };
  }

  @Public()
  @Get('manage/:token')
  @ApiOperation({ summary: 'Get booking detail by manage token (client)' })
  getByToken(@Param('token') token: string) {
    return this.bookingsService.findByToken(token);
  }

  @Public()
  @Patch('manage/:token/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cancel a booking by manage token (client). Must be >24h before start.',
  })
  cancelByToken(
    @Param('token') token: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancelByToken(token, body?.reason);
  }

  @Public()
  @Patch('manage/:token/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Reschedule a booking by manage token (client). Must be >24h before current start.',
  })
  rescheduleByToken(
    @Param('token') token: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingsService.rescheduleByToken(token, dto);
  }

  // ─── Admin ───────────────────────────────────────────────────────────────────

  @Get()
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'List all bookings (admin). Supports filters: status, serviceType, dateFrom, dateTo, search.',
  })
  listAll(@Query() query: QueryBookingsDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking detail by id (admin)' })
  getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (admin)' })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }
}
