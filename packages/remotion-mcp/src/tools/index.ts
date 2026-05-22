const TEMPLATES = [
  {
    id: 'lower-third',
    name: 'Lower Third',
    description: 'Name/title overlay bar with slide-in animation. Best for: introductions, speaker names, call-to-action text.',
    props: ['text', 'subtitle', 'durationInFrames', 'style'],
    keywords: ['subscribe', 'follow', 'name', 'title', 'cta', 'call to action', 'lower third', 'overlay'],
  },
  {
    id: 'kinetic-text',
    name: 'Kinetic Text',
    description: 'Fullscreen animated typography with bounce/scale effects. Best for: big reveals, emotional moments, chapter titles.',
    props: ['text', 'durationInFrames', 'colorScheme', 'animation'],
    keywords: ['reveal', 'chapter', 'moment', 'changed everything', 'shocking', 'title', 'text', 'typography', 'bold', 'word'],
  },
  {
    id: 'icon-burst',
    name: 'Icon Burst',
    description: 'Emoji/icon explosion from center with particle effects. Best for: reaction emphasis, viral moments, celebration.',
    props: ['icon', 'text', 'durationInFrames', 'burstCount'],
    keywords: ['explosion', 'burst', 'emoji', 'reaction', 'viral', 'fire', 'celebrate', 'hype', 'energy', 'impact'],
  },
  {
    id: 'smooth-slide',
    name: 'Smooth Slide',
    description: 'Image/video panels sliding in with depth. Best for: before/after, comparison, showcase, side-by-side.',
    props: ['images', 'text', 'durationInFrames', 'direction'],
    keywords: ['slide', 'compare', 'before', 'after', 'panel', 'showcase', 'side', 'transition'],
  },
  {
    id: 'highlight-reveal',
    name: 'Highlight Reveal',
    description: 'Spotlight/circle reveal with glow ring. Best for: emphasizing a subject, spotlight moment, dramatic reveal.',
    props: ['targetArea', 'text', 'durationInFrames', 'glowColor'],
    keywords: ['spotlight', 'highlight', 'glow', 'reveal', 'dramatic', 'focus', 'emphasis', 'circle', 'ring'],
  },
];

export function selectTemplate(prompt: string): string {
  const lower = prompt.toLowerCase();
  let bestScore = 0;
  let bestId = 'kinetic-text';

  for (const template of TEMPLATES) {
    let score = 0;
    for (const keyword of template.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = template.id;
    }
  }

  return bestId;
}

export function listTemplates() {
  return {
    templates: TEMPLATES.map(({ keywords: _, ...rest }) => rest),
    total: TEMPLATES.length,
  };
}

export function generateBroll({
  prompt,
  durationMs,
  style,
}: {
  prompt: string;
  durationMs: number;
  style?: string;
}) {
  const fps = 30;
  const durationInFrames = Math.round((durationMs / 1000) * fps);
  const templateId = selectTemplate(prompt);
  const template = TEMPLATES.find((t) => t.id === templateId)!;

  const isDark = style?.toLowerCase() === 'dark' || prompt.toLowerCase().includes('dark');

  const inputProps: Record<string, unknown> = {
    durationInFrames,
  };

  switch (templateId) {
    case 'lower-third':
      inputProps.text = prompt.slice(0, 50);
      inputProps.subtitle = '';
      inputProps.style = isDark ? 'dark' : 'light';
      break;
    case 'kinetic-text':
      inputProps.text = prompt.slice(0, 60).toUpperCase();
      inputProps.colorScheme = isDark ? 'dark' : 'light';
      inputProps.animation = 'bounce-scale';
      break;
    case 'icon-burst':
      inputProps.icon = detectEmoji(prompt) || '🔥';
      inputProps.text = prompt.slice(0, 40);
      inputProps.burstCount = 12;
      break;
    case 'smooth-slide':
      inputProps.images = [];
      inputProps.text = prompt.slice(0, 40);
      inputProps.direction = 'left';
      break;
    case 'highlight-reveal':
      inputProps.targetArea = { x: 50, y: 50, size: 30 };
      inputProps.text = prompt.slice(0, 40);
      inputProps.glowColor = isDark ? '#3b82f6' : '#3b82f6';
      break;
  }

  return {
    templateId,
    templateName: template.name,
    inputProps,
    durationInFrames,
  };
}

export function renderBroll({
  templateId,
  inputProps,
}: {
  templateId: string;
  inputProps: Record<string, unknown>;
}) {
  const jobId = `render_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return {
    jobId,
    templateId,
    inputProps,
    status: 'queued',
  };
}

const EMOJI_MAP: Record<string, string> = {
  fire: '🔥',
  hot: '🔥',
  viral: '🔥',
  explode: '💥',
  explosion: '💥',
  wow: '😱',
  shock: '😱',
  love: '❤️',
  heart: '❤️',
  star: '⭐',
  money: '💰',
  rocket: '🚀',
  boom: '💥',
  celebrate: '🎉',
  party: '🎉',
};

function detectEmoji(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(keyword)) return emoji;
  }
  return null;
}
