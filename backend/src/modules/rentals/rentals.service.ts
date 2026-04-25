import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, RentalProduct, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateRentalDto, QueryRentalsDto, UpdateRentalDto } from './dto';
import type { PaginatedResponse } from '../../common/dto';

@Injectable()
export class RentalsService {
  private readonly logger = new Logger(RentalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: CreateRentalDto): Promise<RentalProduct> {
    this.assertImageArraysAligned(dto.imageUrls, dto.imagePublicIds);

    return this.prisma.rentalProduct.create({
      data: {
        name: dto.name,
        description: dto.description,
        sizes: dto.sizes,
        pricePerDay: new Prisma.Decimal(dto.pricePerDay),
        depositAmount: new Prisma.Decimal(dto.depositAmount ?? 0),
        imageUrls: dto.imageUrls,
        imagePublicIds: dto.imagePublicIds,
        status: dto.status ?? RentalStatus.AVAILABLE,
        isVisible: dto.isVisible ?? true,
        quantity: dto.quantity ?? 1,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(
    query: QueryRentalsDto,
    options: { isAdmin: boolean },
  ): Promise<PaginatedResponse<RentalProduct & { availableCount?: number }>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const includeHidden = options.isAdmin && query.includeHidden === 'true';

    const where: Prisma.RentalProductWhereInput = {
      ...(includeHidden ? {} : { isVisible: true }),
      ...(query.status ? { status: query.status } : {}),
      ...(!options.isAdmin
        ? { status: { not: RentalStatus.RETIRED } }
        : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.rentalProduct.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rentalProduct.count({ where }),
    ]);

    const meta = {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    // When a startTime is provided, annotate each product with how many units
    // are still available for that time window/range (quantity minus booked count).
    if (query.startTime) {
      const start = new Date(query.startTime);
      const end = query.endTime ? new Date(query.endTime) : start;
      if (query.endTime && end <= start) {
        throw new BadRequestException('endTime must be after startTime.');
      }
      const ids = data.map((p) => p.id);

      const bookingOverlapWhere = query.endTime
        ? {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gt: start } },
            ],
          }
        : {
            AND: [
              { startTime: { lt: start } },
              { endTime: { gt: start } },
            ],
          };

      const counts = await this.prisma.bookingItem.groupBy({
        by: ['rentalProductId'],
        where: {
          rentalProductId: { in: ids },
          booking: {
            status: BookingStatus.CONFIRMED,
            ...bookingOverlapWhere,
          },
        },
        _count: { rentalProductId: true },
      });

      const countMap = new Map(
        counts.map((c) => [c.rentalProductId, c._count.rentalProductId]),
      );

      return {
        data: data.map((p) => ({
          ...p,
          availableCount: Math.max(0, p.quantity - (countMap.get(p.id) ?? 0)),
        })),
        meta,
      };
    }

    return { data, meta };
  }

  async findOne(
    id: string,
    options: { isAdmin: boolean },
  ): Promise<RentalProduct> {
    const rental = await this.prisma.rentalProduct.findUnique({ where: { id } });
    if (!rental) {
      throw new NotFoundException(`Rental ${id} not found`);
    }
    if (!options.isAdmin && (!rental.isVisible || rental.status === RentalStatus.RETIRED)) {
      throw new NotFoundException(`Rental ${id} not found`);
    }
    return rental;
  }

  async update(id: string, dto: UpdateRentalDto): Promise<RentalProduct> {
    const existing = await this.prisma.rentalProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Rental ${id} not found`);
    }

    if (
      dto.quantity !== undefined &&
      dto.quantity < existing.quantity
    ) {
      await this.assertQuantityCanSupportExistingBookings(id, dto.quantity);
    }

    if (dto.imageUrls || dto.imagePublicIds) {
      const nextUrls = dto.imageUrls ?? existing.imageUrls;
      const nextIds = dto.imagePublicIds ?? existing.imagePublicIds;
      this.assertImageArraysAligned(nextUrls, nextIds);

      const removed = existing.imagePublicIds.filter((id) => !nextIds.includes(id));
      await this.bestEffortDeleteFromCdn(removed);
    }

    const data: Prisma.RentalProductUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.sizes !== undefined ? { sizes: dto.sizes } : {}),
      ...(dto.pricePerDay !== undefined
        ? { pricePerDay: new Prisma.Decimal(dto.pricePerDay) }
        : {}),
      ...(dto.depositAmount !== undefined
        ? { depositAmount: new Prisma.Decimal(dto.depositAmount) }
        : {}),
      ...(dto.imageUrls !== undefined ? { imageUrls: dto.imageUrls } : {}),
      ...(dto.imagePublicIds !== undefined
        ? { imagePublicIds: dto.imagePublicIds }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.isVisible !== undefined ? { isVisible: dto.isVisible } : {}),
      ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
    };

    return this.prisma.rentalProduct.update({ where: { id }, data });
  }

  async remove(id: string): Promise<RentalProduct> {
    const existing = await this.prisma.rentalProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Rental ${id} not found`);
    }

    return this.prisma.rentalProduct.update({
      where: { id },
      data: {
        status: RentalStatus.RETIRED,
        isVisible: false,
      },
    });
  }

  private assertImageArraysAligned(urls: string[], publicIds: string[]): void {
    if (urls.length !== publicIds.length) {
      throw new BadRequestException(
        'imageUrls and imagePublicIds must have the same length (paired by index).',
      );
    }
  }

  private async bestEffortDeleteFromCdn(publicIds: string[]): Promise<void> {
    for (const publicId of publicIds) {
      try {
        await this.uploadService.deleteImage(publicId);
      } catch (error) {
        this.logger.warn(
          `Failed to delete Cloudinary asset ${publicId}: ${(error as Error).message}`,
        );
      }
    }
  }

  private async assertQuantityCanSupportExistingBookings(
    rentalProductId: string,
    nextQuantity: number,
  ): Promise<void> {
    const now = new Date();
    const rows = await this.prisma.bookingItem.findMany({
      where: {
        rentalProductId,
        booking: {
          status: BookingStatus.CONFIRMED,
          endTime: { gt: now },
        },
      },
      select: {
        booking: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (rows.length === 0) return;

    const events: Array<{ at: number; delta: number }> = [];
    for (const row of rows) {
      events.push({ at: row.booking.startTime.getTime(), delta: +1 });
      events.push({ at: row.booking.endTime.getTime(), delta: -1 });
    }

    // Process end events before start events when times are equal
    // to keep interval semantics as [start, end).
    events.sort((a, b) => (a.at - b.at) || (a.delta - b.delta));

    let active = 0;
    let peak = 0;
    for (const event of events) {
      active += event.delta;
      if (active > peak) peak = active;
    }

    if (nextQuantity < peak) {
      throw new BadRequestException(
        `Quantity cannot be set to ${nextQuantity}. ${peak} unit(s) are already reserved in overlapping confirmed bookings.`,
      );
    }
  }
}
