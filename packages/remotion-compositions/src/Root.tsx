import { Composition } from 'remotion';
import { LowerThird } from './compositions/lower-third/Composition';
import { KineticText } from './compositions/kinetic-text/Composition';
import { IconBurst } from './compositions/icon-burst/Composition';
import { SmoothSlide } from './compositions/smooth-slide/Composition';
import { HighlightReveal } from './compositions/highlight-reveal/Composition';

const FPS = 30;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="lower-third"
        component={LowerThird}
        durationInFrames={FPS * 5}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          text: 'Subscribe for more!',
          subtitle: 'New videos every week',
          style: 'light' as const,
        }}
      />
      <Composition
        id="kinetic-text"
        component={KineticText}
        durationInFrames={FPS * 5}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          text: 'THIS CHANGED EVERYTHING',
          colorScheme: 'dark' as const,
          animation: 'bounce-scale' as const,
        }}
      />
      <Composition
        id="icon-burst"
        component={IconBurst}
        durationInFrames={FPS * 3}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          icon: '🔥',
          text: 'VIRAL MOMENT',
          burstCount: 12,
        }}
      />
      <Composition
        id="smooth-slide"
        component={SmoothSlide}
        durationInFrames={FPS * 4}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          images: [],
          text: 'Before & After',
          direction: 'left' as const,
        }}
      />
      <Composition
        id="highlight-reveal"
        component={HighlightReveal}
        durationInFrames={FPS * 4}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          targetArea: { x: 50, y: 50, size: 30 },
          text: 'Look at this!',
          glowColor: '#3b82f6',
        }}
      />
    </>
  );
};
