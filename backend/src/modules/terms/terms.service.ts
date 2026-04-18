import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TermsVersion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTermsDto } from './dto';

@Injectable()
export class TermsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActive(): Promise<TermsVersion> {
    const active = await this.prisma.termsVersion.findFirst({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' },
    });
    if (!active) {
      throw new NotFoundException('No active terms version');
    }
    return active;
  }

  listAll(): Promise<TermsVersion[]> {
    return this.prisma.termsVersion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateTermsDto, createdById: string): Promise<TermsVersion> {
    const existing = await this.prisma.termsVersion.findFirst({
      where: { versionLabel: dto.versionLabel },
    });
    if (existing) {
      throw new ConflictException(
        `Terms version '${dto.versionLabel}' already exists`,
      );
    }

    if (dto.activate) {
      return this.prisma.$transaction(async (tx) => {
        await tx.termsVersion.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
        return tx.termsVersion.create({
          data: {
            versionLabel: dto.versionLabel,
            content: dto.content,
            isActive: true,
            publishedAt: new Date(),
            createdById,
          },
        });
      });
    }

    return this.prisma.termsVersion.create({
      data: {
        versionLabel: dto.versionLabel,
        content: dto.content,
        isActive: false,
        createdById,
      },
    });
  }

  async activate(id: string): Promise<TermsVersion> {
    const target = await this.prisma.termsVersion.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException(`Terms version ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.termsVersion.updateMany({
        where: { isActive: true, NOT: { id } },
        data: { isActive: false },
      });
      return tx.termsVersion.update({
        where: { id },
        data: {
          isActive: true,
          publishedAt: target.publishedAt ?? new Date(),
        },
      });
    });
  }
}
