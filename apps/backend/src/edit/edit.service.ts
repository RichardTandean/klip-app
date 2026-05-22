import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class EditService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async createFromClip(userId: string, clipId: string) {
    const clip = await this.prisma.clip.findUnique({
      where: { id: clipId },
      include: { project: true },
    });

    if (!clip) throw new NotFoundException('Clip not found');
    if (clip.project.userId !== userId) throw new NotFoundException('Clip not found');

    const existing = await this.prisma.edit.findFirst({
      where: { clipId, userId },
    });

    if (existing) return this.findOne(userId, existing.id);

    const edit = await this.prisma.edit.create({
      data: { clipId, projectId: clip.projectId, userId },
    });

    const transcript = await this.prisma.transcript.findFirst({
      where: { video: { projectId: clip.projectId } },
      include: { segments: { orderBy: { index: 'asc' } } },
    });

    if (transcript) {
      const relevantSegments = transcript.segments.filter(
        (s) => s.index >= clip.startSegmentIndex && s.index <= clip.endSegmentIndex,
      );

      if (relevantSegments.length > 0) {
        await this.prisma.editSegment.createMany({
          data: relevantSegments.map((s, i) => ({
            editId: edit.id,
            segmentIndex: s.index,
            type: 'original',
          })),
        });
      }
    }

    return this.findOne(userId, edit.id);
  }

  async findOne(userId: string, editId: string) {
    const edit = await this.prisma.edit.findFirst({
      where: { id: editId, userId },
      include: {
        clip: {
          include: {
            project: {
              include: {
                videos: { take: 1 },
              },
            },
          },
        },
        segments: { orderBy: { segmentIndex: 'asc' } },
      },
    });

    if (!edit) throw new NotFoundException('Edit not found');

    const video = edit.clip.project.videos[0];
    let signedUrl: string | null = null;
    let clipPreviewUrl: string | null = null;

    if (video?.r2Key) {
      try {
        signedUrl = await this.storage.getSignedUrl(video.r2Key, 7200);
      } catch {
        signedUrl = video.r2Url;
      }
      try {
        clipPreviewUrl = await this.storage.getSignedUrl(`previews/${edit.clip.id}.mp4`, 7200);
      } catch {}
    }

    return {
      ...edit,
      signedUrl,
      clipPreviewUrl,
      video,
    };
  }

  async updateSegment(userId: string, editId: string, segmentIndex: number, data: { type?: string; brollUrl?: string; brollPrompt?: string }) {
    const edit = await this.prisma.edit.findFirst({
      where: { id: editId, userId },
    });

    if (!edit) throw new NotFoundException('Edit not found');

    return this.prisma.editSegment.upsert({
      where: {
        editId_segmentIndex: { editId, segmentIndex },
      },
      create: {
        editId,
        segmentIndex,
        type: data.type || 'original',
        brollUrl: data.brollUrl,
        brollPrompt: data.brollPrompt,
      },
      update: {
        type: data.type || 'original',
        brollUrl: data.brollUrl,
        brollPrompt: data.brollPrompt,
      },
    });
  }

  async delete(userId: string, editId: string) {
    const edit = await this.prisma.edit.findFirst({
      where: { id: editId, userId },
    });

    if (!edit) throw new NotFoundException('Edit not found');

    await this.prisma.edit.delete({ where: { id: editId } });
    return { deleted: true };
  }
}
