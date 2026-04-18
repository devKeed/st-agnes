import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GalleryItem, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import {
  CreateGalleryDto,
  QueryGalleryDto,
  ReorderGalleryDto,
  UpdateGalleryDto,
} from './dto';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: CreateGalleryDto): Promise<GalleryItem> {
    return this.prisma.galleryItem.create({
      data: {
        category: dto.category,
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        imagePublicId: dto.imagePublicId,
        sortOrder: dto.sortOrder ?? 0,
        isVisible: dto.isVisible ?? true,
      },
    });
  }

  async findAll(
    query: QueryGalleryDto,
    options: { isAdmin: boolean },
  ): Promise<GalleryItem[]> {
    const includeHidden = options.isAdmin && query.includeHidden === 'true';

    const where: Prisma.GalleryItemWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(includeHidden ? {} : { isVisible: true }),
    };

    return this.prisma.galleryItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(
    id: string,
    options: { isAdmin: boolean },
  ): Promise<GalleryItem> {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Gallery item ${id} not found`);
    }
    if (!options.isAdmin && !item.isVisible) {
      throw new NotFoundException(`Gallery item ${id} not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateGalleryDto): Promise<GalleryItem> {
    const existing = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Gallery item ${id} not found`);
    }

    if (
      dto.imagePublicId !== undefined &&
      existing.imagePublicId &&
      existing.imagePublicId !== dto.imagePublicId
    ) {
      await this.bestEffortDeleteFromCdn(existing.imagePublicId);
    }

    const data: Prisma.GalleryItemUpdateInput = {
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.imagePublicId !== undefined
        ? { imagePublicId: dto.imagePublicId }
        : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.isVisible !== undefined ? { isVisible: dto.isVisible } : {}),
    };

    return this.prisma.galleryItem.update({ where: { id }, data });
  }

  async remove(id: string): Promise<{ id: string }> {
    const existing = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Gallery item ${id} not found`);
    }

    await this.prisma.galleryItem.delete({ where: { id } });

    if (existing.imagePublicId) {
      await this.bestEffortDeleteFromCdn(existing.imagePublicId);
    }

    return { id };
  }

  async reorder(dto: ReorderGalleryDto): Promise<{ updated: number }> {
    const ids = dto.items.map((i) => i.id);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new BadRequestException('Duplicate ids in reorder payload');
    }

    const found = await this.prisma.galleryItem.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      const foundSet = new Set(found.map((f) => f.id));
      const missing = ids.filter((id) => !foundSet.has(id));
      throw new NotFoundException(
        `Unknown gallery item id(s): ${missing.join(', ')}`,
      );
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.galleryItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return { updated: dto.items.length };
  }

  private async bestEffortDeleteFromCdn(publicId: string): Promise<void> {
    try {
      await this.uploadService.deleteImage(publicId);
    } catch (error) {
      this.logger.warn(
        `Failed to delete Cloudinary asset ${publicId}: ${(error as Error).message}`,
      );
    }
  }
}
