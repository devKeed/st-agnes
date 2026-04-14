import { Injectable, NotFoundException } from '@nestjs/common';
import { PolicyType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePolicyVersionDto } from './dto/create-policy-version.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveVersions() {
    const [terms, privacy] = await Promise.all([
      this.prisma.policyVersion.findFirst({
        where: { document: { type: PolicyType.TERMS }, isActive: true },
        include: { document: true },
      }),
      this.prisma.policyVersion.findFirst({
        where: { document: { type: PolicyType.PRIVACY }, isActive: true },
        include: { document: true },
      }),
    ]);

    return { terms, privacy };
  }

  async createVersion(dto: CreatePolicyVersionDto) {
    const document = await this.prisma.policyDocument.upsert({
      where: { type: dto.type },
      create: {
        type: dto.type,
        title: dto.type === PolicyType.TERMS ? 'Terms & Conditions' : 'Privacy Policy',
      },
      update: {},
    });

    const latest = await this.prisma.policyVersion.findFirst({
      where: { documentId: document.id },
      orderBy: { versionNumber: 'desc' },
    });

    const version = await this.prisma.policyVersion.create({
      data: {
        documentId: document.id,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        contentMarkdown: dto.contentMarkdown,
        isActive: Boolean(dto.activate),
      },
    });

    if (dto.activate) {
      await this.prisma.policyVersion.updateMany({
        where: {
          documentId: document.id,
          id: { not: version.id },
        },
        data: { isActive: false },
      });
    }

    return version;
  }

  async activateVersion(versionId: string) {
    const version = await this.prisma.policyVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException('Policy version not found');
    }

    await this.prisma.$transaction([
      this.prisma.policyVersion.updateMany({
        where: { documentId: version.documentId },
        data: { isActive: false },
      }),
      this.prisma.policyVersion.update({
        where: { id: version.id },
        data: { isActive: true },
      }),
    ]);

    return { success: true };
  }

  async listVersions(type: PolicyType) {
    return this.prisma.policyVersion.findMany({
      where: { document: { type } },
      orderBy: { versionNumber: 'desc' },
      include: { document: true },
    });
  }
}
