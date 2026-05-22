import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MotionService {
  private readonly logger = new Logger(MotionService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async create(userId: string, dto: { prompt: string; durationMs: number; style?: string }) {
    const mg = await this.prisma.motionGraphic.create({
      data: {
        userId,
        prompt: dto.prompt,
        template: 'auto',
        status: 'PROCESSING',
      },
    });

    const result = this.processGeneration(mg.id, dto);

    return { id: mg.id, status: 'processing', prompt: dto.prompt };
  }

  async findAll(userId: string) {
    return this.prisma.motionGraphic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findOne(userId: string, id: string) {
    const mg = await this.prisma.motionGraphic.findFirst({
      where: { id, userId },
    });

    if (!mg) return null;

    let signedUrl: string | null = null;
    if (mg.r2Key) {
      try {
        signedUrl = await this.storage.getSignedUrl(mg.r2Key, 3600);
      } catch {}
    }

    return { ...mg, signedUrl };
  }

  private async processGeneration(
    id: string,
    dto: { prompt: string; durationMs: number; style?: string },
  ) {
    try {
      const mcpUrl = process.env.MCP_URL || 'http://localhost:3001';

      const genRes = await fetch(`${mcpUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: dto.prompt,
          durationMs: dto.durationMs,
          style: dto.style,
        }),
      });

      if (!genRes.ok) throw new Error('MCP generation failed');

      const { templateId, inputProps, templateName } = await genRes.json();

      await this.prisma.motionGraphic.update({
        where: { id },
        data: {
          template: templateId,
          inputProps: inputProps,
          status: 'COMPLETED',
          r2Url: `mock_r2_url_${Date.now()}`,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Generation failed: ${error}`);
      await this.prisma.motionGraphic.update({
        where: { id },
        data: { status: 'FAILED' },
      });
    }
  }
}
