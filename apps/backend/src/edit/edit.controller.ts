import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EditService } from './edit.service';

@Controller('edits')
@UseGuards(JwtAuthGuard)
export class EditController {
  constructor(private readonly editService: EditService) {}

  @Post()
  create(@Req() req: Request, @Body() body: { clipId: string }) {
    const user = req.user as { id: string };
    return this.editService.createFromClip(user.id, body.clipId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.editService.findOne(user.id, id);
  }

  @Patch(':id/segments/:segmentIndex')
  updateSegment(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('segmentIndex') segmentIndex: string,
    @Body() body: { type?: string; brollUrl?: string; brollPrompt?: string },
  ) {
    const user = req.user as { id: string };
    return this.editService.updateSegment(user.id, id, parseInt(segmentIndex, 10), body);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.editService.delete(user.id, id);
  }
}
