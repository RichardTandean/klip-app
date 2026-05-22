import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const createProjectSchema = z.object({
  youtubeUrl: z.string().url().refine((url) => url.includes('youtube.com') || url.includes('youtu.be'), {
    message: 'Must be a valid YouTube URL',
  }),
});

export const exportFormatSchema = z.object({
  aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  resolution: z.enum(['1080p', '720p']),
  quality: z.enum(['high', 'medium']),
});

export const generateBrollSchema = z.object({
  prompt: z.string().min(1).max(500),
  durationMs: z.number().min(1000).max(30000),
  style: z.string().optional(),
});

export const segmentTypeSchema = z.enum(['original', 'broll_upload', 'broll_generated']);

export const updateSegmentSchema = z.object({
  type: segmentTypeSchema,
  brollUrl: z.string().url().optional(),
  brollPrompt: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ExportFormatInput = z.infer<typeof exportFormatSchema>;
export type GenerateBrollInput = z.infer<typeof generateBrollSchema>;
export type SegmentType = z.infer<typeof segmentTypeSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
