import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface KineticTextProps {
  text?: string;
  colorScheme?: 'light' | 'dark';
  animation?: 'bounce-scale' | 'typewriter' | 'slide-left';
}

export const KineticText = ({
  text = '',
  colorScheme = 'light',
  animation: _animation = 'bounce-scale',
}: KineticTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#0a0a0a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0a0a0a';

  const entrance = spring({ frame, fps, config: { damping: 200, stiffness: 80 } });
  const exit = spring({ frame: Math.max(0, frame - fps * 3), fps, config: { damping: 200 } });

  const scale = interpolate(entrance, [0, 1], [0.5, 1]);
  const opacity = 1 - exit;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: 'center',
          padding: '0 80px',
        }}
      >
        <h1
          style={{
            color: textColor,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {text}
        </h1>
        <div
          style={{
            width: interpolate(entrance, [0, 1], [0, 120]),
            height: 4,
            backgroundColor: '#3b82f6',
            borderRadius: 2,
            margin: '24px auto 0',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
