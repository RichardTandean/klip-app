# Transitions — Remotion Best Practices

## Common Transition Patterns

### Wipe (direction-based reveal)
```ts
const progress = spring({ frame, fps, config: { damping: 200 } });
const width = interpolate(progress, [0, 1], [0, 100]);
// Use as clip-path or width for horizontal wipe
<div style={{ width: `${width}%`, overflow: 'hidden' }}>{content}</div>
```

### Slide In (translate)
```ts
const slideX = interpolate(progress, [0, 1], [-200, 0]);
const slideY = interpolate(progress, [0, 1], [50, 0]);
<div style={{ transform: `translateX(${slideX}px) translateY(${slideY}px)` }}>{content}</div>
```

### Fade + Scale (attention grab)
```ts
const scale = interpolate(progress, [0, 1], [0.8, 1]);
const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });
<div style={{ transform: `scale(${scale})`, opacity }}>{content}</div>
```

### Crossfade (between two elements)
```ts
// Outgoing
const outOpacity = interpolate(frame, [0, 15], [1, 0]);
// Incoming
const inOpacity = interpolate(frame, [10, 25], [0, 1]);
```

## Duration Guidelines
- Simple wipe/slide: 20-30 frames (~0.7-1s at 30fps)
- Complex scale+fade: 30-45 frames (~1-1.5s)
- Staggered text reveal: 3-5 frames per character
