import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

@Controller('stream')
export class StreamController {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  @Get('clip/:clipId')
  async streamClip(@Param('clipId') clipId: string, @Req() req: Request, @Res() res: Response) {
    const clip = await this.prisma.clip.findUnique({
      where: { id: clipId },
      include: { project: { include: { videos: { take: 1 } } } },
    });

    if (!clip) return res.status(404).json({ error: 'Clip not found' });

    const video = clip.project.videos[0];
    if (!video?.r2Key) return res.status(404).json({ error: 'Video not found' });

    const raw = this.storage as any;
    const client = raw.client;
    const bucket = raw.bucket || 'klip';
    if (!client) return res.status(500).json({ error: 'Storage unavailable' });

    const previewKey = `previews/${clipId}.mp4`;
    let key = video.r2Key;

    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: previewKey }));
      key = previewKey;
    } catch {}

    try {
      const resp = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

      const chunks: Buffer[] = [];
      const body = resp.Body as NodeJS.ReadableStream;

      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      const totalSize = buffer.length;

      const range = req.headers.range;

      res.set({
        'Content-Type': resp.ContentType || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10) || 0;
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const actualEnd = Math.min(end, totalSize - 1);
        const chunkSize = actualEnd - start + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${actualEnd}/${totalSize}`,
          'Content-Length': chunkSize.toString(),
        });

        res.end(buffer.slice(start, actualEnd + 1));
      } else {
        res.set({ 'Content-Length': totalSize.toString() });
        res.end(buffer);
      }
    } catch (e: any) {
      console.error('Stream error:', e?.message || e);
      return res.status(500).json({ error: 'Stream failed' });
    }
  }
}
