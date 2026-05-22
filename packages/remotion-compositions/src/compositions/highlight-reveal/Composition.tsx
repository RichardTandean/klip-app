import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface HighlightRevealProps {
  targetArea?: { x: number; y: number; size: number };
  text?: string;
  glowColor?: string;
}

export const HighlightReveal = ({
  targetArea = { x: 50, y: 50, size: 30 },
  text,
  glowColor = '#3b82f6',
}: HighlightRevealProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const progress = spring({ frame, fps, config: { damping: 200, stiffness: 100 } });

  const circleX = (targetArea.x / 100) * width;
  const circleY = (targetArea.y / 100) * height;
  const circleSize = (targetArea.size / 100) * Math.min(width, height);

  const maskRadius = interpolate(progress, [0, 1], [0, circleSize * 1.5]);
  const ringOpacity = interpolate(progress, [0.6, 1], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: circleX - maskRadius,
            top: circleY - maskRadius,
            width: maskRadius * 2,
            height: maskRadius * 2,
            borderRadius: '50%',
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.7)`,
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: circleX,
          top: circleY,
          width: circleSize * 2,
          height: circleSize * 2,
          borderRadius: '50%',
          border: `4px solid ${glowColor}`,
          opacity: ringOpacity,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}40`,
        }}
      />

      {text && (
        <div
          style={{
            position: 'absolute',
            left: circleX,
            top: circleY + circleSize + 40,
            transform: 'translateX(-50%)',
            opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 700,
              textShadow: `0 0 20px ${glowColor}`,
            }}
          >
            {text}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
