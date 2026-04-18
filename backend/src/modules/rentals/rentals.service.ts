import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RentalProduct, RentalStatus } from '@prisma/client';
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
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(
    query: QueryRentalsDto,
    options: { isAdmin: boolean },
  ): Promise<PaginatedResponse<RentalProduct>> {
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

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
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
}
