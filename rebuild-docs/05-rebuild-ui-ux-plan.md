# AI-VIBE-CHAT-V1: UI/UX Rebuild Plan

## Theme Direction: "Enterprise Glassmorphism"

### Visual Identity Concept

**Aesthetic:** Dark, sophisticated, translucent layers with vibrant accents
**Mood:** Professional yet futuristic, trustworthy yet innovative
**Reference:** Apple Vision OS meets enterprise dashboard

**Key Visual Elements:**
- Frosted glass cards with backdrop blur
- Deep navy background with subtle gradients
- Purple-to-cyan accent gradients
- Soft, diffused shadows
- Generous spacing and breathing room

---

## Color System

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| --bg-primary | #0f172a | Main background |
| --bg-secondary | #1e293b | Card backgrounds |
| --bg-tertiary | #334155 | Elevated surfaces |
| --accent-primary | #8b5cf6 | Primary actions, user messages |
| --accent-secondary | #06b6d4 | Secondary actions, AI messages |
| --text-primary | #f1f5f9 | Main text |
| --text-secondary | #94a3b8 | Muted text, timestamps |
| --text-tertiary | #64748b | Disabled, placeholders |
| --border-glass | rgba(255,255,255,0.1) | Card borders |
| --border-focus | #8b5cf6 | Focus states |

### Gradient Definitions

```scss
// Primary gradient (buttons, highlights)
$gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);

// Background gradient (subtle depth)
$gradient-bg: radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%);

// Message gradients
$gradient-user: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
$gradient-ai: linear-gradient(135deg, #334155 0%, #1e293b 100%);
```

### Glassmorphism Specification

```scss
@mixin glass-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

---

## Layout Model

### Overall Structure

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (280px)    │  Main Chat Area (flex: 1)     │
│  - Chat history     │  ┌─────────────────────────┐  │
│  - New chat button  │  │  Header (60px)          │  │
│  - Settings         │  ├─────────────────────────┤  │
│                     │  │                         │  │
│  Glass effect       │  │  Message List           │  │
│  Collapsible on     │  │  (scrollable)           │  │
│  mobile             │  │                         │  │
│                     │  │                         │  │
│                     │  ├─────────────────────────┤  │
│                     │  │  Input Area (auto)      │  │
│                     │  └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|------------|-------|---------------|
| Mobile | < 640px | Sidebar drawer, full-width chat |
| Tablet | 640-1024px | Collapsible sidebar |
| Desktop | > 1024px | Fixed sidebar, centered chat |
| Wide | > 1440px | Max-width container, centered |

---

## Chat Layout Pattern

### Message Bubble Styles

**User Messages:**
- Position: Right-aligned
- Background: Gradient purple
- Border-radius: 16px 16px 4px 16px
- Max-width: 70%
- Shadow: Subtle glow effect
- Typography: White text

**AI Messages:**
- Position: Left-aligned
- Background: Glass card style
- Border-radius: 16px 16px 16px 4px
- Max-width: 80%
- Shadow: Standard glass shadow
- Typography: Primary text color

**System/Error Messages:**
- Center-aligned
- Full width with padding
- Distinct background (subtle red tint for errors)
- Icon + text layout

### Message Components

```
┌────────────────────────────────────┐
│  🤖 AI Name                    Time │
├────────────────────────────────────┤
│                                    │
│  Message content here...           │
│                                    │
│  ```typescript                     │
│  code blocks with syntax highlight │
│  ```                               │
│                                    │
├────────────────────────────────────┤
│  [Copy] [Regenerate] [👍] [👎]     │
└────────────────────────────────────┘
```

---

## Sidebar Behavior

### Desktop (> 1024px)
- Fixed width: 280px
- Always visible
- Glass morphism background
- Scrollable chat history list

### Tablet (640-1024px)
- Collapsible with toggle button
- Slide-in animation
- Overlay backdrop when open
- Auto-close on chat selection

### Mobile (< 640px)
- Full-screen drawer
- Swipe to close gesture
- Bottom sheet on landscape
- Bottom nav for quick actions

### Sidebar Content Structure

```
┌─────────────────────┐
│  + New Chat         │  ← Primary CTA button
├─────────────────────┤
│  Recent Chats       │  ← Section header
│  ├─ Chat title...   │
│  ├─ Chat title...   │  ← Scrollable list
│  └─ Chat title...   │
├─────────────────────┤
│  Starred            │  ← Pinned chats
│  ├─ Important...    │
├─────────────────────┤
│                     │
│                     │
├─────────────────────┤
│  ⚙️ Settings        │  ← Bottom actions
│  👤 Profile         │
└─────────────────────┘
```

---

## Input Area Design

### Layout

```
┌─────────────────────────────────────────────────────┐
│  📎  [Text input area...            ]  [Send]  [🎤] │
│       ^ Attachment                    ^ Primary   ^  │
│         button                          action    Voice │
└─────────────────────────────────────────────────────┘
```

### Specifications

- Background: Glass card with higher opacity
- Height: Auto-expanding (min: 56px, max: 200px)
- Border: 1px subtle, glow on focus
- Placeholder: Muted text color
- Character counter: Bottom right, appears after 100 chars
- Typing indicator: Above input, left-aligned

### Attachment Handling

- Drag-and-drop zone highlight
- File chips below input
- Supported types: Images, PDF, Code files
- Max size indicator
- Remove button per file

---

## Accessibility Goals

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 minimum for text |
| Focus indicators | 2px solid accent color |
| Keyboard navigation | Full Tab navigation |
| Screen reader | ARIA labels on all interactive elements |
| Reduced motion | Respect prefers-reduced-motion |
| Text resize | 200% zoom without breaking layout |

### Focus Management

- Visible focus ring on all interactive elements
- Focus trap in modals
- Skip-to-content link
- Logical tab order

### Screen Reader Support

- Semantic HTML structure
- ARIA live regions for new messages
- Role attributes for custom components
- Alt text for all images

---

## Responsiveness Goals

### Mobile-First Approach

1. Base styles for mobile
2. Progressive enhancement for larger screens
3. Touch-friendly targets (min 44px)
4. Swipe gestures for common actions

### Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Time to Interactive | < 3.5s |

---

## Animation Specifications

### Transitions

| Element | Duration | Easing |
|---------|----------|--------|
| Message appear | 300ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Sidebar slide | 250ms | ease-out |
| Modal open | 200ms | cubic-bezier(0, 0, 0.2, 1) |
| Hover effects | 150ms | ease |
| Page transitions | 300ms | ease-in-out |

### Micro-interactions

- Button hover: Scale 1.02 + shadow increase
- Message hover: Action buttons fade in
- Typing indicator: Bouncing dots
- New message: Slide up + fade in
- Loading state: Skeleton shimmer

---

## Component Library Mapping

| Custom Component | Naive UI Equivalent |
|-----------------|---------------------|
| Button | NButton (customized) |
| Input | NInput (autosize) |
| Modal | NModal |
| Select | NSelect |
| Dropdown | NDropdown |
| Tooltip | NTooltip |
| Switch | NSwitch |
| Slider | NSlider |
| Checkbox | NCheckbox |
| Radio | NRadio |
| Card | Custom (glass style) |
| Message | Custom (chat-specific) |
| Sidebar | Custom layout |
| Toast | NMessage |

---

## Icon System

**Library:** Lucide Vue (maintain consistency)

| Icon | Usage |
|------|-------|
| MessageSquare | Chat indicator |
| Settings | Settings panel |
| Plus | New chat |
| Send | Send message |
| Paperclip | Attachment |
| Copy | Copy message |
| ThumbsUp/Down | Feedback |
| RefreshCw | Regenerate |
| MoreVertical | Message options |
| Trash | Delete |
| Edit | Rename chat |
| Star | Star chat |
| Menu | Mobile sidebar toggle |
