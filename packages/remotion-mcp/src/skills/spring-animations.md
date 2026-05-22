# Spring Animations — Remotion Best Practices

## Default Spring Config
```ts
import { spring } from 'remotion';

const value = spring({
  frame: useCurrentFrame(),
  fps: 30,
  config: { damping: 200, stiffness: 50, mass: 1 },
});
```

## Presets

| Name | damping | stiffness | mass | Effect |
|------|---------|-----------|------|--------|
| gentle | 200 | 100 | 1 | Soft, elegant entrance |
| wobbly | 10 | 100 | 1 | Bouncy, playful |
| stiff | 200 | 300 | 1 | Quick, firm snap |
| molasses | 200 | 20 | 1 | Heavy, slow reveal |

## Entrance/Exit Patterns
```ts
// Entrance: scale from center
const entrance = spring({ frame, fps, config: { damping: 200, stiffness: 80 } });
const scale = interpolate(entrance, [0, 1], [0.5, 1]);

// Exit: fade out
const exit = spring({ frame: Math.max(0, frame - fps * 3), fps });
const opacity = 1 - exit;
```

## Staggered Children
```ts
const delay = 5; // frames between each child
const childSpring = spring({ frame: Math.max(0, frame - i * delay), fps });
```
