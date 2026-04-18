import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentType, SiteContent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertContentDto } from './dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SiteContent[]> {
    return this.prisma.siteContent.findMany({ orderBy: { pageKey: 'asc' } });
  }

  async findOne(key: string): Promise<SiteContent> {
    const item = await this.prisma.siteContent.findUnique({
      where: { pageKey: key },
    });
    if (!item) {
      throw new NotFoundException(`Content key '${key}' not found`);
    }
    return item;
  }

  upsert(
    key: string,
    dto: UpsertContentDto,
    updatedById: string,
  ): Promise<SiteContent> {
    return this.prisma.siteContent.upsert({
      where: { pageKey: key },
      update: {
        value: dto.value,
        ...(dto.contentType ? { contentType: dto.contentType } : {}),
        updatedById,
      },
      create: {
        pageKey: key,
        value: dto.value,
        contentType: dto.contentType ?? ContentType.TEXT,
        updatedById,
      },
    });
  }
}
