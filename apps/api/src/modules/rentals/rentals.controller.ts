import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRentalItemDto, UpdateRentalItemDto } from './dto';
import { RentalsService } from './rentals.service';

@Controller('api/v1/rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  listActive() {
    return this.rentalsService.listActive();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  listAll() {
    return this.rentalsService.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateRentalItemDto) {
    return this.rentalsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateRentalItemDto) {
    return this.rentalsService.update(id, dto);
  }
}
