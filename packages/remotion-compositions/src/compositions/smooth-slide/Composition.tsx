import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface SmoothSlideProps {
  images?: string[];
  text?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const SmoothSlide = ({ text = 'Before & After', direction = 'left' }: SmoothSlideProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideProgress = spring({ frame, fps, config: { damping: 200, stiffness: 60 } });

  const getTransform = () => {
    const startOffset = 200;
    switch (direction) {
      case 'left':
        return `translateX(${interpolate(slideProgress, [0, 1], [-startOffset, 0])}px)`;
      case 'right':
        return `translateX(${interpolate(slideProgress, [0, 1], [startOffset, 0])}px)`;
      case 'up':
        return `translateY(${interpolate(slideProgress, [0, 1], [startOffset, 0])}px)`;
      case 'down':
        return `translateY(${interpolate(slideProgress, [0, 1], [-startOffset, 0])}px)`;
      default:
        return 'none';
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          transform: getTransform(),
          opacity: slideProgress,
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 48 }}>📸</span>
        </div>
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 48 }}>✨</span>
        </div>
      </div>
      {text && (
        <div style={{ position: 'absolute', bottom: 100 }}>
          <span
            style={{
              color: '#ffffff',
              fontSize: 32,
              fontWeight: 700,
              opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          >
            {text}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
