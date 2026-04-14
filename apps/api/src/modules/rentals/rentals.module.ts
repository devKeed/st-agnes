import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';

@Module({
  providers: [RentalsService],
  controllers: [RentalsController],
})
export class RentalsModule {}
