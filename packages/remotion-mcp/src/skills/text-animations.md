# Text Animations — Remotion Best Practices

## Kinetic Typography Patterns

### Character-by-character stagger (bounce-scale)
```ts
const chars = text.split('');
const charDelay = 3;

chars.map((char, i) => {
  const charSpring = spring({ frame: Math.max(0, frame - i * charDelay), fps });
  const charScale = interpolate(charSpring, [0, 1], [0, 1.5]);
  return <span style={{ transform: `scale(${charScale})`, display: 'inline-block' }}>{char}</span>;
});
```

### Typewriter effect
```ts
const visibleChars = Math.floor(interpolate(frame, [0, text.length * 2], [0, text.length]));
const displayText = text.slice(0, visibleChars);
```

### Scale + opacity combo (most common)
```ts
const entrance = spring({ frame, fps, config: { damping: 200 } });
const scale = interpolate(entrance, [0, 1], [0.5, 1]);
const opacity = entrance;
```

## Text Styling
- Font size: 48-72px for headlines, 28-40px for subtext
- Font weight: 700-800 for impact
- Letter spacing: -0.02em for tight headlines
- Always use `lineHeight: 1.1` for multi-line
- Use `textShadow` for readability on variable backgrounds
