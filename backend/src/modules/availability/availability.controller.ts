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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { AvailabilityService } from './availability.service';
import {
  BlockDateDto,
  QueryAvailabilityDto,
  QueryBlockedDatesDto,
  UpdateBusinessHoursDto,
} from './dto';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Get available appointment slots for a month (public). Pass ?month=YYYY-MM&service=RENTAL.',
  })
  getAvailability(@Query() query: QueryAvailabilityDto) {
    return this.availabilityService.getMonthAvailability(query);
  }

  @Public()
  @Get('business-hours')
  @ApiOperation({ summary: 'Get studio business hours (public)' })
  getBusinessHours() {
    return this.availabilityService.getBusinessHours();
  }

  @Post('block')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Block a date or time range (admin). Omit startTime/endTime for a full-day block.',
  })
  block(@Body() dto: BlockDateDto, @CurrentUser('id') adminId: string) {
    return this.availabilityService.blockDate(dto, adminId);
  }

  @Get('blocked')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'List blocked date/time entries (admin). Pass optional ?month=YYYY-MM to filter by month.',
  })
  listBlocked(@Query() query: QueryBlockedDatesDto) {
    return this.availabilityService.listBlockedDates(query);
  }

  @Delete('block/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a blocked date/time (admin)' })
  unblock(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.availabilityService.unblockDate(id);
  }

  @Put('business-hours')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Upsert business hours (admin). Partial update supported — only rows in the payload are changed.',
  })
  updateBusinessHours(@Body() dto: UpdateBusinessHoursDto) {
    return this.availabilityService.updateBusinessHours(dto);
  }
}
