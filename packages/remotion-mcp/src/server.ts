import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listTemplates, generateBroll, renderBroll } from './tools';

const server = new McpServer({
  name: 'klip-remotion',
  version: '0.1.0',
});

server.tool(
  'list_templates',
  'List all available motion graphic templates with descriptions and input props',
  {},
  async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(listTemplates(), null, 2),
        },
      ],
    };
  },
);

server.tool(
  'generate_broll',
  'Generate a b-roll motion graphic based on a text prompt. Returns the composition name and props to render.',
  {
    prompt: z.string().describe('Description of the b-roll to generate'),
    durationMs: z.number().min(1000).max(30000).describe('Duration in milliseconds'),
    style: z.string().optional().describe('Visual style preference'),
  },
  async ({ prompt, durationMs, style }) => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(generateBroll({ prompt, durationMs, style }), null, 2),
        },
      ],
    };
  },
);

server.tool(
  'render_broll',
  'Queue a render job for a b-roll composition. Returns a job ID.',
  {
    templateId: z.string().describe('Template ID to render'),
    inputProps: z.record(z.unknown()).describe('Input props for the composition'),
  },
  async ({ templateId, inputProps }) => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(renderBroll({ templateId, inputProps }), null, 2),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Klip Remotion MCP server running on stdio');
}

main().catch(console.error);
