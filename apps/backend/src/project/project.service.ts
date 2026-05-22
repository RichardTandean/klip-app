import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    @InjectQueue('youtube-download') private downloadQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const title = dto.title || this.extractTitle(dto.youtubeUrl);

    const project = await this.prisma.project.create({
      data: {
        userId,
        title,
        youtubeUrl: dto.youtubeUrl,
        status: 'PENDING',
      },
    });

    await this.downloadQueue.add('download', {
      projectId: project.id,
      youtubeUrl: dto.youtubeUrl,
    }, {
      jobId: `download_${project.id}`,
    });

    return project;
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { clips: true } },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        videos: true,
        clips: true,
        _count: { select: { clips: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async getTranscript(userId: string, projectId: string) {
    const project = await this.findOne(userId, projectId);

    const video = await this.prisma.video.findFirst({
      where: { projectId: project.id },
      include: {
        transcript: {
          include: {
            segments: { orderBy: { index: 'asc' } },
          },
        },
      },
    });

    if (!video?.transcript) {
      return { segments: [], fullText: null };
    }

    return {
      fullText: video.transcript.fullText,
      segments: video.transcript.segments,
    };
  }

  async delete(userId: string, id: string) {
    const project = await this.findOne(userId, id);

    const videos = await this.prisma.video.findMany({
      where: { projectId: id },
    });

    for (const video of videos) {
      if (video.r2Key) {
        try {
          await this.storage.delete(video.r2Key);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }

    await this.prisma.project.delete({ where: { id } });

    return { deleted: true };
  }

  private extractTitle(url: string): string {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return `Clip from ${u.pathname.slice(1)}`;
      }
      const videoId = u.searchParams.get('v') || url;
      return `Project ${videoId.slice(0, 11)}`;
    } catch {
      return url.slice(0, 50);
    }
  }
}
