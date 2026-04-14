import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRentalItemDto, UpdateRentalItemDto } from './dto';

@Injectable()
export class RentalsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.rentalItem.findMany({ where: { isActive: true } });
  }

  listAll() {
    return this.prisma.rentalItem.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateRentalItemDto) {
    return this.prisma.rentalItem.create({ data: dto });
  }

  async update(id: string, dto: UpdateRentalItemDto) {
    const existing = await this.prisma.rentalItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Rental item not found');
    }

    return this.prisma.rentalItem.update({ where: { id }, data: dto });
  }
}
