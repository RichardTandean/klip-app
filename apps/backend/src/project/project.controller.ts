import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const user = req.user as { id: string };
    return this.projectService.create(user.id, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.projectService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.projectService.findOne(user.id, id);
  }

  @Get(':id/transcript')
  getTranscript(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.projectService.getTranscript(user.id, id);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.projectService.delete(user.id, id);
  }
}
