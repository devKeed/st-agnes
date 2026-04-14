import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto, SelfServiceActionDto } from './dto/self-service.dto';

class UpsertAvailabilityRuleDto {
  weekday!: number;
  startMinutes!: number;
  endMinutes!: number;
  slotIntervalMin!: number;
}

class CreateBlackoutDto {
  startAtUtc!: string;
  endAtUtc!: string;
  reason?: string;
}

class UpdateBookingStatusDto {
  status!: BookingStatus;
}

@Controller('api/v1')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  availability(@Query() query: CheckAvailabilityDto) {
    return this.bookingsService.checkAvailability(query);
  }

  @Post('bookings')
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(dto);
  }

  @Get('bookings/:referenceCode')
  getByReference(@Param('referenceCode') referenceCode: string) {
    return this.bookingsService.getByReference(referenceCode);
  }

  @Post('bookings/:referenceCode/cancel')
  cancel(@Param('referenceCode') referenceCode: string, @Body() dto: SelfServiceActionDto) {
    return this.bookingsService.cancelSelfService(referenceCode, dto);
  }

  @Post('bookings/:referenceCode/reschedule')
  reschedule(@Param('referenceCode') referenceCode: string, @Body() dto: RescheduleBookingDto) {
    return this.bookingsService.rescheduleSelfService(referenceCode, dto);
  }

  @Get('admin/bookings')
  @UseGuards(JwtAuthGuard)
  listAdminBookings() {
    return this.bookingsService.listAdminBookings();
  }

  @Post('admin/bookings/:id/status')
  @UseGuards(JwtAuthGuard)
  updateBookingStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateBookingStatus(id, dto.status);
  }

  @Post('admin/availability-rules')
  @UseGuards(JwtAuthGuard)
  upsertRule(@Body() dto: UpsertAvailabilityRuleDto) {
    return this.bookingsService.upsertAvailabilityRule(dto);
  }

  @Post('admin/blackouts')
  @UseGuards(JwtAuthGuard)
  createBlackout(@Body() dto: CreateBlackoutDto) {
    return this.bookingsService.createBlackout(dto);
  }
}
