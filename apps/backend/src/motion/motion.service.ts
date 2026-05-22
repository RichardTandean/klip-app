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

    this.processGeneration(mg.id, dto);

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
      const mcpUrl = process.env.MCP_URL || 'http://remotion-mcp:3001';
      const rendererUrl = process.env.RENDER_URL || 'http://remotion-renderer:8080';

      this.logger.log(`Generating b-roll template for: "${dto.prompt}"`);

      const genRes = await fetch(`${mcpUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: dto.prompt,
          durationMs: dto.durationMs,
          style: dto.style,
        }),
      });

      if (!genRes.ok) throw new Error(`MCP generate failed: ${await genRes.text()}`);

      const { templateId, templateName, inputProps } = await genRes.json();
      this.logger.log(`Template selected: ${templateId} (${templateName})`);

      const tsxRes = await fetch(`${mcpUrl}/api/render-source-tsx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, inputProps }),
      });

      if (!tsxRes.ok) throw new Error(`MCP tsx generation failed: ${await tsxRes.text()}`);

      const { tsxSource } = await tsxRes.json();
      this.logger.log(`TSX source generated, sending to Remotion renderer`);

      const renderRes = await fetch(`${rendererUrl}/render-source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'video/mp4',
        },
        body: JSON.stringify({
          source: tsxSource,
          inputProps,
          width: 1080,
          height: 1920,
          durationInFrames: inputProps.durationInFrames || 90,
          fps: 30,
        }),
      });

      if (!renderRes.ok) {
        const errText = await renderRes.text();
        throw new Error(`Remotion render failed: ${errText.slice(0, 500)}`);
      }

      const videoBuffer = Buffer.from(await renderRes.arrayBuffer());
      this.logger.log(`Render complete, video size: ${(videoBuffer.length / 1024).toFixed(1)}KB`);

      const r2Key = this.storage.generateKey('motion', `${id}.mp4`);
      const r2Url = await this.storage.uploadBuffer(videoBuffer, r2Key, 'video/mp4');
      this.logger.log(`Uploaded to R2: ${r2Key}`);

      await this.prisma.motionGraphic.update({
        where: { id },
        data: {
          template: templateId,
          inputProps: inputProps as any,
          status: 'COMPLETED',
          r2Url,
          r2Key,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Motion graphic ${id} completed`);
    } catch (error) {
      this.logger.error(`Generation failed: ${error}`);
      await this.prisma.motionGraphic.update({
        where: { id },
        data: { status: 'FAILED' },
      });
    }
  }
}
