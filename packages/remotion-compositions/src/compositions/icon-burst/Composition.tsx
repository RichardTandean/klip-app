import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface IconBurstProps {
  icon?: string;
  text?: string;
  burstCount?: number;
}

export const IconBurst = ({ icon = '🔥', text, burstCount = 12 }: IconBurstProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;

  const scale = spring({ frame, fps, config: { damping: 100, stiffness: 50 } });
  const textOpacity = interpolate(frame, [10, 20], [0, 1], { extrapolateRight: 'clamp' });

  const particles = Array.from({ length: burstCount }, (_, i) => {
    const angle = (i / burstCount) * Math.PI * 2;
    const distance = interpolate(spring({ frame: Math.max(0, frame - i * 2), fps }), [0, 1], [0, 250]);
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      opacity: 1 - frame / 60,
      icon: i % 2 === 0 ? '✨' : '💫',
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            fontSize: 32,
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {p.icon}
        </div>
      ))}
      <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 96, lineHeight: 1 }}>{icon}</span>
        {text && <span style={{ color: '#ffffff', fontSize: 40, fontWeight: 800, opacity: textOpacity }}>{text}</span>}
      </div>
    </AbsoluteFill>
  );
};
