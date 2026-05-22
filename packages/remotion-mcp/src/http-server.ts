import express from 'express';
import { listTemplates, generateBroll, renderBroll, generateTsxSource } from './tools/index.js';

const app = express();
app.use(express.json());

const renderJobs = new Map<string, { status: string; templateId: string; outputPath?: string; error?: string }>();

app.get('/api/templates', (_req, res) => {
  res.json(listTemplates());
});

app.post('/api/generate', (req, res) => {
  try {
    const { prompt, durationMs, style } = req.body;

    if (!prompt || !durationMs) {
      return res.status(400).json({ error: 'prompt and durationMs are required' });
    }

    const result = generateBroll({ prompt, durationMs, style });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/render', (req, res) => {
  try {
    const { templateId, inputProps } = req.body;

    if (!templateId || !inputProps) {
      return res.status(400).json({ error: 'templateId and inputProps are required' });
    }

    const result = renderBroll({ templateId, inputProps });
    renderJobs.set(result.jobId, { status: 'queued', templateId });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/render-source-tsx', (req, res) => {
  try {
    const { templateId, inputProps } = req.body;

    if (!templateId || !inputProps) {
      return res.status(400).json({ error: 'templateId and inputProps are required' });
    }

    const tsxSource = generateTsxSource(templateId, inputProps);

    if (!tsxSource) {
      return res.status(400).json({ error: 'unknown templateId' });
    }

    res.json({ templateId, tsxSource, inputProps });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/render/:jobId/status', (req, res) => {
  const job = renderJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'job not found' });
  }
  res.json(job);
});

app.patch('/api/render/:jobId/status', (req, res) => {
  const job = renderJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'job not found' });
  }
  if (req.body.status) job.status = req.body.status;
  if (req.body.outputPath) job.outputPath = req.body.outputPath;
  if (req.body.error) job.error = req.body.error;
  res.json(job);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'klip-remotion-mcp' });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Klip Remotion MCP HTTP server running on port ${port}`);
});
