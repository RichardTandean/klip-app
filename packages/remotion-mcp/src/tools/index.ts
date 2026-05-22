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

export function generateTsxSource(
  templateId: string,
  inputProps: Record<string, unknown>,
): string {

  switch (templateId) {
    case 'lower-third': {
      const text = (inputProps.text as string) || 'Subscribe';
      const subtitle = (inputProps.subtitle as string) || '';
      const style = (inputProps.style as string) || 'light';
      const bgColor = style === 'dark' ? '#1a1a2e' : '#ffffff';
      const textColor = style === 'dark' ? '#ffffff' : '#1a1a2e';
      return `
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export default function LowerThird() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideIn = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', paddingBottom: 80, alignItems: 'center' }}>
      <div style={{
        background: '${bgColor}',
        padding: '20px 40px',
        borderRadius: 16,
        transform: \`translateX(\${slideIn * 0}px) translateY(\${(1 - slideIn) * 50}px)\`,
        opacity: slideIn,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <p style={{ color: '${textColor}', fontSize: 32, fontWeight: 700, margin: 0, textAlign: 'center' }}>
          ${text}
        </p>
        ${subtitle ? `<p style={{ color: '${textColor}', fontSize: 18, opacity: 0.7, margin: '8px 0 0', textAlign: 'center' }}>${subtitle}</p>` : ''}
      </div>
    </AbsoluteFill>
  );
}
`;
    }

    case 'kinetic-text': {
      const text = (inputProps.text as string) || 'AWESOME';
      const colorScheme = (inputProps.colorScheme as string) || 'light';
      const bgColor = colorScheme === 'dark' ? '#0f0f23' : '#f8f9fa';
      const textColor = colorScheme === 'dark' ? '#ffffff' : '#1a1a2e';
      const accentColor = '#ff6b6b';
      return `
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export default function KineticText() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 8 } });
  const rotate = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });

  const chars = '${text}'.split('');

  return (
    <AbsoluteFill style={{ backgroundColor: '${bgColor}', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, transform: \`scale(\${scale})\` }}>
        {chars.map((c, i) => (
          <span
            key={i}
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: i % 3 === 0 ? '${accentColor}' : '${textColor}',
              transform: \`translateY(\${spring({ frame: Math.max(0, frame - i * 2), fps, config: { damping: 10 } }) * 0 - (1 - spring({ frame: Math.max(0, frame - i * 2), fps, config: { damping: 10 } })) * 60}px)\`,
            }}
          >
            {c === ' ' ? '\u00A0' : c}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}
`;
    }

    case 'icon-burst': {
      const icon = (inputProps.icon as string) || '🔥';
      const text = (inputProps.text as string) || '';
      const burstCount = (inputProps.burstCount as number) || 12;
      return `
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b'];

export default function IconBurst() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mainScale = spring({ frame, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0f23', justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: ${burstCount} }).map((_, i) => {
        const angle = (i / ${burstCount}) * Math.PI * 2;
        const distance = spring({ frame: Math.max(0, frame - i * 2), fps, config: { damping: 15 } }) * 200;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const s = spring({ frame: Math.max(0, frame - i * 2), fps, config: { damping: 12 } });
        return (
          <div key={i} style={{
            position: 'absolute',
            fontSize: 24,
            transform: \`translate(\${x}px, \${y}px) scale(\${s})\`,
            opacity: s,
            color: colors[i % colors.length],
          }}>
            {String.fromCodePoint(128293)}
          </div>
        );
      })}
      <div style={{ transform: \`scale(\${mainScale})\`, fontSize: 80, zIndex: 1 }}>
        ${icon}
      </div>
      ${text ? `<p style={{ position: 'absolute', bottom: 80, color: '#fff', fontSize: 28, fontWeight: 700, textAlign: 'center' }}>${text}</p>` : ''}
    </AbsoluteFill>
  );
}
`;
    }

    case 'smooth-slide': {
      const text = (inputProps.text as string) || '';
      const direction = (inputProps.direction as string) || 'left';
      return `
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export default function SmoothSlide() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 15 } });
  const dir = '${direction}';
  const translateX = dir === 'left' ? (1 - slide) * -200 : (1 - slide) * 200;

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        transform: \`translateX(\${translateX}px)\`,
        opacity: slide,
        padding: 40,
        borderRadius: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        ${text ? `<p style={{ color: '#fff', fontSize: 36, fontWeight: 700, margin: 0, textAlign: 'center' }}>${text}</p>` : ''}
      </div>
    </AbsoluteFill>
  );
}
`;
    }

    case 'highlight-reveal': {
      const text = (inputProps.text as string) || '';
      const glowColor = (inputProps.glowColor as string) || '#3b82f6';
      return `
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export default function HighlightReveal() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const reveal = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: reveal * Math.max(width, height) * 1.5,
        height: reveal * Math.max(width, height) * 1.5,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        background: \`radial-gradient(circle, transparent 30%, #0a0a1a 70%)\`,
        boxShadow: \`0 0 60px \${reveal * 0.5}px ${glowColor}\`,
      }} />
      ${text ? `<p style={{
        position: 'absolute',
        bottom: 100,
        width: '100%',
        textAlign: 'center',
        color: '#fff',
        fontSize: 32,
        fontWeight: 700,
        opacity: spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 10 } }),
      }}>${text}</p>` : ''}
    </AbsoluteFill>
  );
}
`;
    }

    default:
      return '';
  }
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
