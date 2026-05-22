import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClipService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('clip-analysis') private clipAnalysisQueue: Queue,
  ) {}

  async findAll(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.clip.findMany({
      where: { projectId },
      orderBy: { viralScore: 'desc' },
    });
  }

  async triggerAnalysis(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'READY') {
      throw new Error(
        `Project not ready for analysis. Current status: ${project.status}`,
      );
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'PENDING' },
    });

    await this.clipAnalysisQueue.add('analyze', { projectId }, {
      jobId: `clip_analysis_${projectId}`,
    });

    return { status: 'analysis_started', projectId };
  }
}
