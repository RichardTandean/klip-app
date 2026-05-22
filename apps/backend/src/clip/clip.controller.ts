import { Controller, Get, Post, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClipService } from './clip.service';

@Controller('projects/:projectId/clips')
@UseGuards(JwtAuthGuard)
export class ClipController {
  constructor(private readonly clipService: ClipService) {}

  @Get()
  findAll(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.clipService.findAll(user.id, projectId);
  }

  @Post('analyze')
  analyze(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.clipService.triggerAnalysis(user.id, projectId);
  }

  @Get(':clipId/preview')
  async preview(@Req() req: Request, @Param('projectId') projectId: string, @Param('clipId') clipId: string, @Res() res: Response) {
    const user = req.user as { id: string };
    const result = await this.clipService.getPreview(user.id, projectId, clipId);
    res.json(result);
  }
}
