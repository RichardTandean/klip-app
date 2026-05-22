import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsUrl()
  youtubeUrl: string;

  @IsOptional()
  @IsString()
  title?: string;
}
