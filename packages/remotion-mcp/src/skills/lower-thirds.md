# Lower Thirds — Remotion Best Practices

## Standard Layout
```
┌─────────────────────────────────┐
│                                 │
│                                 │  (video content)
│                                 │
│   ┌──────────────────────┐      │
│   │  MAIN TITLE TEXT      │     │  ← 2-line text bar
│   │  Subtitle smaller     │     │
│   └──────────────────────┘      │
│         bottom 10%              │
└─────────────────────────────────┘
```

## Positioning
```ts
paddingLeft: 80,    // left margin
paddingBottom: 120, // bottom margin (10% of 1080p)
maxWidth: '80%',    // don't stretch full width
```

## Animation Pattern
```ts
const slideUp = spring({ frame, fps, config: { damping: 200, stiffness: 100 } });
const translateY = (1 - slideUp) * 50;
const opacity = slideUp;
```

## Styling Options

### Light Theme
```ts
bgColor: 'rgba(255,255,255,0.9)'
textColor: '#000000'
subtitleColor: 'rgba(0,0,0,0.6)'
```

### Dark Theme
```ts
bgColor: 'rgba(0,0,0,0.8)'
textColor: '#ffffff'
subtitleColor: 'rgba(255,255,255,0.7)'
```

### With Accent Bar
```ts
// Add a colored bar on the left edge
<div style={{ width: 4, backgroundColor: accentColor, borderRadius: '4px 0 0 4px' }} />
```

## Typography
- Main text: 34-40px, weight 700
- Subtitle: 20-24px, weight 500
- Border radius: 12px
- Padding: 24px 40px
- Gap between lines: 4px
