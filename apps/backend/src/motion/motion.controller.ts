import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MotionService } from './motion.service';

@Controller('motion')
@UseGuards(JwtAuthGuard)
export class MotionController {
  constructor(private readonly motionService: MotionService) {}

  @Post('generate')
  create(
    @Req() req: Request,
    @Body() body: { prompt: string; durationMs: number; style?: string },
  ) {
    const user = req.user as { id: string };
    return this.motionService.create(user.id, body);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.motionService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.motionService.findOne(user.id, id);
  }
}
