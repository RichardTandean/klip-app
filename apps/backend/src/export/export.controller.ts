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
import { ExportService } from './export.service';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  create(
    @Req() req: Request,
    @Body() body: { editId: string; aspectRatio: string; resolution: string; quality: string },
  ) {
    const user = req.user as { id: string };
    return this.exportService.triggerExport(user.id, body.editId, {
      aspectRatio: body.aspectRatio,
      resolution: body.resolution,
      quality: body.quality,
    });
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.exportService.listExports(user.id);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.exportService.getStatus(user.id, id);
  }
}
