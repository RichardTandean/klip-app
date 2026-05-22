import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface LowerThirdProps {
  text?: string;
  subtitle?: string;
  style?: 'light' | 'dark';
}

export const LowerThird = ({ text = '', subtitle, style = 'light' }: LowerThirdProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({ frame, fps, config: { damping: 200, stiffness: 100 } });

  const isDark = style === 'dark';
  const bgColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
  const textColor = isDark ? '#ffffff' : '#000000';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        paddingLeft: 80,
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - slideUp) * 50}px)`,
          opacity: slideUp,
          backgroundColor: bgColor,
          borderRadius: 12,
          padding: '24px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxWidth: '80%',
        }}
      >
        <span
          style={{
            color: textColor,
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {text}
        </span>
        {subtitle && (
          <span
            style={{
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              fontSize: 22,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
