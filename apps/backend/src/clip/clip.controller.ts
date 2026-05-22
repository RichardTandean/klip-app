import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
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
}
