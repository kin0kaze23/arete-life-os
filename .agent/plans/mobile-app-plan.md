# Areté Life OS — Mobile App Plan

> Comprehensive evaluation and implementation strategy for a native mobile version.
>
> Last updated: 2026-01-29

---

## Part 1: UX Evaluation of Current Web App

### What Works Well

1. **Single Input Philosophy** — The LogBar as the sole input method is a strong mobile pattern. Luke Wroblewski's "One Thumb, One Eyeball" principle applies perfectly: one text field, one submit. This should be preserved.

2. **Three-Column Dashboard** — Maps naturally to a card-based mobile feed. Each column becomes a swipeable section or tab within the dashboard.

3. **Encrypted Local-First** — Mobile users care deeply about privacy. Zero-knowledge encryption is a genuine differentiator in the App Store.

4. **AI-First Interaction** — No manual categorization, no forms to fill. The user speaks naturally and the system structures. This is ideal for mobile where typing is expensive.

### What Needs Rethinking for Mobile

#### Problem 1: Hover-Dependent Interactions

The current UI has 126 `onClick` handlers but 0 `onTouchStart` handlers. Tooltips, rationale text, and contextual actions are all hidden behind `hover:` states that don't exist on mobile.

**Principle (Wroblewski):** "If it's important, it's visible. If it's visible, it's actionable."

**Fix:** Replace hover-reveal patterns with:

- Inline disclosure (always-visible rationale text, smaller)
- Long-press → context sheet (iOS) / bottom sheet (Android)
- Swipe actions for keep/remove/delete

#### Problem 2: Sidebar Navigation Wastes Mobile Space

The sidebar takes 80px even when collapsed (`w-20`). On a 375px iPhone screen, that's 21% of horizontal space consumed by navigation chrome.

**Principle (Saarinen):** "Reduce UI to increase focus. The interface should disappear in service of the task."

**Fix:** Replace sidebar with:

- Bottom tab bar (5 tabs: Dashboard, Stream, Chat, Vault, Settings)
- Full-width content area
- Tab bar hides on scroll-down, reappears on scroll-up

#### Problem 3: Dashboard Density Too High for Mobile

The 3-column grid collapses to a single column on mobile, but the content volume (tasks + events + status + recommendations + always chips) creates a 6-7 screen-length scroll.

**Principle (Wroblewski):** "Prioritize ruthlessly. Mobile forces you to decide what matters most."

**Fix:** Mobile dashboard should show exactly 3 things:

1. **Top Card**: Today's #1 priority task (full width, prominent)
2. **Quick Stack**: Next 3-4 tasks (compact list)
3. **Upcoming**: Next event with time countdown

Everything else (recommendations, blind spots, always chips) moves to a dedicated "Insights" tab or pull-down drawer.

#### Problem 4: LogBar Positioning Conflicts with Mobile Keyboards

The sticky bottom LogBar will overlap with the soft keyboard on iOS/Android, creating a janky experience. iOS safe area insets are not handled.

**Principle (Wroblewski):** "Input is the bottleneck on mobile. Remove every obstacle."

**Fix:**

- LogBar becomes a floating action button (FAB) that expands into a full-screen input sheet
- On tap: smooth expand animation, keyboard auto-focuses
- On submit: collapse back to FAB with success feedback (haptic + brief toast)
- Voice input button alongside text input

#### Problem 5: No Gesture Language

Modern mobile apps (Linear, Things 3, Todoist) use gestures as primary interactions:

- Swipe right to complete a task
- Swipe left to delete/snooze
- Long-press to reorder
- Pull-down to refresh

Current app has none of these.

**Principle (Saarinen):** "Direct manipulation creates agency. Buttons are a fallback."

**Fix:** Implement gesture vocabulary:

| Gesture     | Action              | Context          |
| ----------- | ------------------- | ---------------- |
| Swipe right | Complete task       | FocusList        |
| Swipe left  | Delete/snooze       | FocusList        |
| Long-press  | Edit / context menu | Any item         |
| Pull-down   | Refresh AI analysis | Dashboard        |
| Tap event   | Show prep plan      | UpcomingCalendar |
| Double-tap  | Quick-log "done"    | Habit items      |

#### Problem 6: No Offline-First Behavior

Mobile users lose connectivity constantly (subway, airplane, poor signal). Current app silently returns fallbacks when offline but provides no feedback.

**Principle (Wroblewski):** "Design for the worst network, not the best."

**Fix:**

- Queue inputs when offline → process when reconnected
- Show clear offline indicator (subtle, not alarming)
- All vault data accessible offline (already encrypted locally)
- AI features gracefully degraded with "Waiting for connection" state

---

## Part 2: Mobile Architecture Strategy

### Recommended Stack

| Layer         | Technology                              | Rationale                                                 |
| ------------- | --------------------------------------- | --------------------------------------------------------- |
| Framework     | **React Native + Expo**                 | 70% code sharing with web; fastest path to market         |
| Styling       | **NativeWind v4**                       | Tailwind syntax → native styles; matches current codebase |
| Navigation    | **Expo Router**                         | File-based routing, deep linking, tab + stack navigation  |
| Storage       | **expo-sqlite** + **expo-secure-store** | SQLite for vault data, Secure Store for encryption key    |
| State         | **Shared useAura hook**                 | Extracted to monorepo `packages/shared`                   |
| Animation     | **react-native-reanimated**             | 60fps gesture-driven animations                           |
| Gestures      | **react-native-gesture-handler**        | Swipe, long-press, pan gestures                           |
| Auth          | **expo-local-authentication**           | Biometric (Face ID / fingerprint) for vault unlock        |
| Notifications | **expo-notifications**                  | Daily plan reminders, task nudges                         |
| Icons         | **lucide-react-native**                 | Same icon set as web                                      |

### Why React Native Over Flutter

1. **70% code sharing** — `useAura.ts`, `geminiService.ts`, `types.ts`, `design-tokens.ts` can be imported directly
2. **Same language** — TypeScript everywhere, no Dart learning curve
3. **Expo ecosystem** — Managed workflow handles native complexity (signing, OTA updates, push notifications)
4. **NativeWind** — Preserves Tailwind class names from current codebase, reducing mental overhead

### Monorepo Structure

```
areté-life-os/
├── packages/
│   ├── shared/                    # Platform-agnostic business logic
│   │   ├── src/
│   │   │   ├── types.ts           # ← from data/types.ts
│   │   │   ├── ai/
│   │   │   │   ├── geminiService.ts  # ← from ai/geminiService.ts
│   │   │   │   ├── prompts.ts        # ← from ai/prompts.ts
│   │   │   │   └── validators.ts     # ← from ai/validators.ts
│   │   │   ├── crypto/
│   │   │   │   ├── vault.ts          # Crypto logic (Web Crypto API)
│   │   │   │   └── adapters.ts       # Platform-specific storage adapters
│   │   │   ├── finance/
│   │   │   │   └── financeUtils.ts   # ← from data/financeUtils.ts
│   │   │   ├── claims/
│   │   │   │   └── claimUtils.ts     # ← from data/claimUtils.ts
│   │   │   ├── hooks/
│   │   │   │   └── useAura.ts        # Core state (with StorageAdapter)
│   │   │   └── tokens/
│   │   │       └── design-tokens.ts  # ← from shared/design-tokens.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                        # Current web app (refactored)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── shared/             # Web-specific UI components
│   │   │   └── adapters/
│   │   │       └── webStorage.ts   # localStorage + IndexedDB adapter
│   │   ├── api/                    # Vercel serverless (unchanged)
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── mobile/                     # New React Native app
│       ├── app/                    # Expo Router screens
│       │   ├── (tabs)/
│       │   │   ├── index.tsx       # Dashboard
│       │   │   ├── stream.tsx      # Life Stream
│       │   │   ├── log.tsx         # Quick Log (FAB target)
│       │   │   ├── vault.tsx       # Vault / Profile
│       │   │   └── settings.tsx    # Settings
│       │   ├── _layout.tsx         # Root layout + tab bar
│       │   └── lock.tsx            # Vault lock screen
│       ├── components/
│       │   ├── TaskCard.tsx         # Swipeable task
│       │   ├── EventCard.tsx        # Upcoming event
│       │   ├── InsightCard.tsx      # AI insight
│       │   ├── LogSheet.tsx         # Full-screen input
│       │   └── QuickActions.tsx     # FAB menu
│       ├── adapters/
│       │   ├── mobileStorage.ts    # SQLite + SecureStore adapter
│       │   └── mobileCrypto.ts     # expo-crypto adapter
│       ├── package.json
│       └── app.json                # Expo config
│
├── api/                            # Shared Vercel API (unchanged)
├── docs/
└── package.json                    # Workspace root
```

### Storage Adapter Interface

```typescript
// packages/shared/src/crypto/adapters.ts

export interface StorageAdapter {
  // Key-value storage (for vault, settings)
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;

  // File storage (for attachments)
  putFile(key: string, data: Blob | ArrayBuffer, encryptionKey?: CryptoKey): Promise<void>;
  getFile(key: string, encryptionKey?: CryptoKey): Promise<ArrayBuffer | null>;
  deleteFile(key: string): Promise<void>;

  // Secure key storage (for encryption key caching)
  setSecureItem(key: string, value: string): Promise<void>;
  getSecureItem(key: string): Promise<string | null>;
  deleteSecureItem(key: string): Promise<void>;
}

// Web implementation: localStorage + IndexedDB + in-memory key
// Mobile implementation: expo-sqlite + expo-secure-store + expo-file-system
```

---

## Part 3: Mobile UI/UX Design Specification

### Design Principles

Inspired by Linear (Karri Saarinen), Things 3, and Apple HIG:

1. **Clarity over decoration** — No gradients, no shadows unless functional. Information hierarchy through typography and spacing.
2. **Direct manipulation** — Gestures first, buttons second. Every list item is swipeable.
3. **Progressive disclosure** — Show the minimum needed. Details on demand via sheets, not new screens.
4. **Speed as a feature** — Every interaction feels instant. Optimistic updates, skeleton loading, no spinners.
5. **Dark by default** — Premium dark theme matches the web app. OLED-black backgrounds save battery.

### Screen Specifications

#### 1. Lock Screen (Vault Gate)

```
┌─────────────────────────────────┐
│                                 │
│          ◇ (Areté logo)         │
│                                 │
│      "Your Life OS awaits"      │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Enter passphrase...     │   │
│   └─────────────────────────┘   │
│                                 │
│      [Unlock with Face ID]      │
│                                 │
│   ┌─────────────────────────┐   │
│   │     Unlock Vault        │   │
│   └─────────────────────────┘   │
│                                 │
│      Import  ·  Create New      │
│                                 │
└─────────────────────────────────┘
```

**Mobile Enhancement:** Biometric auth (Face ID / fingerprint) as primary unlock. Passphrase as fallback.

#### 2. Dashboard (Home Tab)

```
┌─────────────────────────────────┐
│ Good morning, Jonathan    [👤]  │  ← Greeting + profile avatar
├─────────────────────────────────┤
│                                 │
│ ┌─ TODAY'S FOCUS ─────────────┐ │
│ │                             │ │
│ │  ◉ Review Q2 budget         │ │  ← Primary task (large)
│ │    Finance · High Priority  │ │
│ │    ─────────────────────── │ │
│ │  ○ Morning devotion         │ │  ← Secondary tasks (compact)
│ │  ○ Schedule dentist         │ │
│ │  ○ Call Mom                 │ │
│ │                             │ │
│ │  [Plan My Day →]            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ NEXT UP ───────────────────┐ │
│ │  📅  Tennis with Dexter     │ │  ← Next event
│ │      Tomorrow · 10:00 PM    │ │
│ │      [Prep Plan →]          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ INSIGHT ───────────────────┐ │
│ │  💡 "Your sleep consistency │ │  ← Top AI insight
│ │   has improved 23% this     │ │
│ │   week. Keep the 11pm       │ │
│ │   window."                  │ │
│ └─────────────────────────────┘ │
│                                 │
│              (●)                │  ← FAB (Log button)
├─────────────────────────────────┤
│ [🏠] [📊] [💬] [🔐] [⚙]       │  ← Bottom tab bar
└─────────────────────────────────┘
```

**Key Decisions:**

- **Maximum 5 tasks visible** — no scrolling within the task card
- **Single insight** — the most impactful one. "See all" link for more.
- **Single event** — next upcoming only. Full calendar in Stream tab.
- **FAB** — floating action button for quick logging (most used action)

#### 3. Log Input Sheet

```
┌─────────────────────────────────┐
│                         [Done]  │
│                                 │
│  What's happening?              │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  Had great meeting with │   │  ← Auto-expanding text area
│  │  the team today about   │   │
│  │  Q2 roadmap_            │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [📎 Attach] [🎤 Voice] [📷]   │  ← Action row
│                                 │
│  ┌─ Quick Actions ───────────┐ │
│  │  /plan  /ask  /sync       │ │  ← Command shortcuts
│  └───────────────────────────┘ │
│                                 │
│ ┌──────────────────────────────┐│
│ │         Log It               ││  ← Full-width submit
│ └──────────────────────────────┘│
│          ▔▔▔▔▔▔▔▔▔              │  ← Home indicator
└─────────────────────────────────┘
```

**Mobile Enhancements:**

- **Voice input** — "Record and transcribe" for hands-free logging
- **Camera** — Quick photo attachment (receipts, notes, whiteboards)
- **Haptic feedback** — Subtle vibration on submit
- **Processing state** — Sheet stays open with "Processing..." indicator, then auto-dismisses with success animation

#### 4. Task Interaction (Swipe Actions)

```
Normal state:
┌─────────────────────────────────┐
│  ○  Review Q2 budget            │
│     Finance · Due today         │
└─────────────────────────────────┘

Swiping right (complete):
┌─────────────────────────────────┐
│ ✓ Done ░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────┘

Swiping left (actions):
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░ [Snooze] [🗑]│
└─────────────────────────────────┘
```

#### 5. Vault Lock Screen (Biometric)

```
┌─────────────────────────────────┐
│                                 │
│          ◇                      │
│                                 │
│    Areté Life OS                │
│    Locked · 2h 14m ago          │
│                                 │
│         [Face ID icon]          │
│    Tap to unlock with Face ID   │
│                                 │
│    or use passphrase →          │
│                                 │
└─────────────────────────────────┘
```

### Typography Scale (Mobile)

| Token        | Web  | Mobile | Usage                |
| ------------ | ---- | ------ | -------------------- |
| `heading`    | 20px | 22px   | Section headers      |
| `subheading` | 14px | 16px   | Card titles          |
| `body`       | 12px | 14px   | Primary content      |
| `label`      | 10px | 12px   | Labels, metadata     |
| `micro`      | 9px  | 11px   | Timestamps, tertiary |

Mobile sizes increase 2px across the board for touch readability (minimum 11px per Apple HIG).

### Color System (Mobile-Adapted)

```
Background:
  - Primary:    #000000  (OLED black — saves battery)
  - Surface:    #0A0A0F  (elevated cards)
  - Elevated:   #111118  (modals, sheets)

Text:
  - Primary:    #FFFFFF
  - Secondary:  #94A3B8  (slate-400)
  - Tertiary:   #475569  (slate-600)

Accent:
  - Brand:      #6366F1  (indigo-500)
  - Success:    #10B981  (emerald-500)
  - Warning:    #F59E0B  (amber-500)
  - Danger:     #EF4444  (red-500)
```

### Animation Specifications

| Interaction     | Duration | Curve                  | Notes                       |
| --------------- | -------- | ---------------------- | --------------------------- |
| Sheet open      | 300ms    | `easeOut`              | Spring-based, interruptible |
| Sheet close     | 250ms    | `easeIn`               | Faster than open            |
| Task complete   | 400ms    | `spring(1, 80, 10)`    | Satisfying bounce           |
| Tab switch      | 200ms    | `easeInOut`            | Cross-fade content          |
| FAB expand      | 250ms    | `spring(0.8, 100, 12)` | Scale + fade                |
| Pull-to-refresh | 600ms    | `linear`               | Match native feel           |
| Toast appear    | 300ms    | `spring`               | Slide from top              |

---

## Part 4: Mobile-Specific Features

### 4.1 Biometric Vault Unlock

**Flow:**

1. App opens → check if vault exists
2. If yes → attempt Face ID / fingerprint
3. If biometric succeeds → retrieve encryption key from Secure Store → unlock
4. If fails → show passphrase input
5. Store encryption key in `expo-secure-store` (hardware-backed keychain)

**Security:**

- Encryption key never in plain memory longer than session
- Secure Store uses iOS Keychain / Android Keystore
- Biometric is a convenience layer over the same AES-256-GCM encryption
- Passphrase always available as fallback

### 4.2 Push Notifications

| Notification   | Trigger                | Content                                        |
| -------------- | ---------------------- | ---------------------------------------------- |
| Morning Plan   | 7:00 AM (configurable) | "Your daily plan is ready. 4 tasks today."     |
| Event Prep     | 1 hour before event    | "Tennis with Dexter in 1h. Tap for prep plan." |
| Habit Reminder | Configurable time      | "Time for morning devotion."                   |
| Weekly Review  | Sunday 7 PM            | "Weekly review: 23/28 tasks completed."        |

### 4.3 Widgets (iOS 17+ / Android)

**iOS Widget (Small — 2x2):**

```
┌──────────────────┐
│ Today's Focus     │
│                   │
│ ◉ Review budget   │
│ ○ Call Mom        │
│                   │
│ 2/5 complete      │
└──────────────────┘
```

**iOS Widget (Medium — 4x2):**

```
┌────────────────────────────────────┐
│ Today's Focus          Next Up     │
│                                    │
│ ◉ Review budget     📅 Tennis      │
│ ○ Call Mom             Tomorrow    │
│ ○ Schedule dentist     10:00 PM   │
│                                    │
│ 2/5 complete        [Prep Plan →] │
└────────────────────────────────────┘
```

### 4.4 Voice Input

```typescript
// Integration with expo-speech / Whisper API
1. User taps microphone icon in LogSheet
2. Start recording with visual waveform
3. On stop → transcribe via Whisper API (or on-device)
4. Transcribed text appears in input field
5. User can edit before submitting
```

### 4.5 Offline Queue

```typescript
interface OfflineQueue {
  id: string;
  action: 'log' | 'complete' | 'delete' | 'update';
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

// When offline:
1. Input accepted and stored locally
2. Memory items created immediately (optimistic)
3. AI calls queued
4. Visual indicator: "Queued · Will process when online"

// When reconnected:
1. Process queue in order (FIFO)
2. AI analysis runs
3. Update local state with AI results
4. Clear queue
```

---

## Part 5: Implementation Phases

### Phase 0: Monorepo Setup (1 week)

**Goal:** Extract shared logic without breaking the web app.

| Task                                      | Files                                             | Notes                                 |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Set up turborepo/pnpm workspace           | `package.json`, `turbo.json`                      | Root workspace config                 |
| Create `packages/shared`                  | New package                                       | Shared types + logic                  |
| Move `data/types.ts` → shared             | `types.ts`                                        | Zero changes needed                   |
| Move `ai/` → shared                       | `geminiService.ts`, `prompts.ts`, `validators.ts` | Zero changes needed                   |
| Move `shared/design-tokens.ts` → shared   | `design-tokens.ts`                                | Zero changes needed                   |
| Create StorageAdapter interface           | `adapters.ts`                                     | Interface only                        |
| Create WebStorageAdapter                  | `webStorage.ts`                                   | Wrap current localStorage + IndexedDB |
| Refactor useAura to accept StorageAdapter | `useAura.ts`                                      | Replace direct localStorage calls     |
| Verify web app still works                | `npm run doctor`                                  | Must pass                             |

### Phase 1: Mobile Foundation (2-3 weeks)

**Goal:** Bootable Expo app with vault unlock and empty dashboard.

| Task                                     | Priority | Notes                    |
| ---------------------------------------- | -------- | ------------------------ |
| Init Expo project with TypeScript        | P0       | `npx create-expo-app`    |
| Configure NativeWind                     | P0       | Tailwind → native styles |
| Set up Expo Router (tab navigation)      | P0       | 5 tabs                   |
| Implement MobileStorageAdapter (SQLite)  | P0       | Core dependency          |
| Port VaultLockView → mobile              | P0       | Passphrase + biometric   |
| Add expo-secure-store for key management | P0       | Hardware-backed          |
| Connect useAura hook with mobile adapter | P0       | Business logic working   |
| Empty dashboard shell rendering          | P0       | Tab navigation + header  |
| API connection to Vercel backend         | P0       | Same serverless API      |

### Phase 2: Core UX (3-4 weeks)

**Goal:** Functional dashboard with logging, tasks, and events.

| Task                                     | Priority | Notes                          |
| ---------------------------------------- | -------- | ------------------------------ |
| Build TaskCard with swipe gestures       | P0       | Complete + delete              |
| Build Dashboard home screen              | P0       | Tasks + next event + insight   |
| Build LogSheet (FAB → full-screen input) | P0       | Text + file attach             |
| Build EventCard with prep plan           | P1       | Tap → prep sheet               |
| Implement pull-to-refresh                | P1       | Triggers refreshAura           |
| Add haptic feedback                      | P1       | On complete, submit, error     |
| Build processing/loading states          | P1       | Skeleton screens, not spinners |
| Port StatusSidebar → mobile Insights     | P2       | Recommendations + blind spots  |

### Phase 3: Full Feature Parity (2-3 weeks)

**Goal:** All web features available on mobile.

| Task                                  | Priority | Notes                   |
| ------------------------------------- | -------- | ----------------------- |
| Life Stream tab (timeline + history)  | P1       | Scrollable feed         |
| Chat tab (Oracle)                     | P1       | AI chat interface       |
| Vault tab (profile editor)            | P1       | Form-based editing      |
| Settings tab                          | P2       | Config, export, prompts |
| Knowledge graph browser (MemoryVault) | P2       | Simplified for mobile   |
| Command palette                       | P2       | Search + quick actions  |

### Phase 4: Mobile-Native Features (2 weeks)

**Goal:** Features that make mobile version better than web.

| Task                | Priority | Notes                    |
| ------------------- | -------- | ------------------------ |
| Push notifications  | P1       | Morning plan, event prep |
| Voice input         | P1       | Microphone in LogSheet   |
| iOS/Android widgets | P2       | Today's Focus widget     |
| Camera attachment   | P2       | Quick photo capture      |
| Offline queue       | P2       | Background sync          |
| Share extension     | P3       | Log from other apps      |

### Phase 5: Polish & Launch (1-2 weeks)

| Task                                        | Priority |
| ------------------------------------------- | -------- |
| Performance optimization (60fps)            | P0       |
| Accessibility audit (VoiceOver, TalkBack)   | P0       |
| App Store assets (screenshots, description) | P0       |
| TestFlight / Internal testing               | P0       |
| App Store submission                        | P0       |

---

## Part 6: Code Sharing Strategy

### What Shares Directly (Copy or Import)

| Module                    | Lines            | Changes Needed              |
| ------------------------- | ---------------- | --------------------------- |
| `data/types.ts`           | 466              | None                        |
| `ai/geminiService.ts`     | ~235             | None (fetch is universal)   |
| `ai/prompts.ts`           | ~215             | None                        |
| `ai/validators.ts`        | ~100             | None (Zod works everywhere) |
| `data/financeUtils.ts`    | ~80              | None                        |
| `data/claimUtils.ts`      | ~60              | None                        |
| `shared/design-tokens.ts` | ~120             | None                        |
| `core/eventUtils.ts`      | ~200             | None                        |
| **Total shareable**       | **~1,476 lines** | **Zero changes**            |

### What Needs Adapter Pattern

| Module            | Web Adapter                  | Mobile Adapter                      |
| ----------------- | ---------------------------- | ----------------------------------- |
| `cryptoVault.ts`  | `window.crypto.subtle`       | `expo-crypto` (same API)            |
| Storage           | `localStorage` + `IndexedDB` | `expo-sqlite` + `expo-secure-store` |
| File Storage      | `IndexedDB` blob store       | `expo-file-system`                  |
| Network Detection | `navigator.onLine`           | `@react-native-community/netinfo`   |

### What Gets Rebuilt (Mobile-Specific)

| Component        | Web Version             | Mobile Version            |
| ---------------- | ----------------------- | ------------------------- |
| DashboardView    | 3-column grid           | Single-column feed        |
| LogBar           | Sticky bottom bar       | FAB → full-screen sheet   |
| Sidebar          | Left nav panel          | Bottom tab bar            |
| FocusList        | List with hover actions | Swipeable list            |
| UpcomingCalendar | Vertical scroll widget  | Card with countdown       |
| StatusSidebar    | Right panel             | Dedicated "Insights" tab  |
| VaultLockView    | Centered card           | Full-screen + biometric   |
| Tooltips         | Hover-reveal            | Long-press → bottom sheet |

---

## Part 7: Performance Budget

### App Size Budget

| Component              | Target            | Notes                       |
| ---------------------- | ----------------- | --------------------------- |
| Initial download       | < 15 MB           | App Store binary            |
| JS bundle              | < 3 MB            | Hermes-compiled             |
| First meaningful paint | < 1.5s            | Cold start to dashboard     |
| Vault unlock           | < 500ms           | Biometric → decrypted state |
| Log submission         | < 200ms perceived | Optimistic update           |

### Runtime Performance

| Metric              | Target            | Method                     |
| ------------------- | ----------------- | -------------------------- |
| Frame rate          | 60 fps            | Reanimated for animations  |
| Task list scroll    | No jank           | FlatList with recycling    |
| Input latency       | < 16ms            | Avoid blocking main thread |
| AI response display | < 100ms perceived | Skeleton → content swap    |
| Memory usage        | < 150 MB          | Limit cached memory items  |

---

## Part 8: Risks and Mitigations

| Risk                                               | Impact | Probability | Mitigation                                             |
| -------------------------------------------------- | ------ | ----------- | ------------------------------------------------------ |
| Web Crypto API not available on all devices        | High   | Low         | Use `expo-crypto` polyfill; fallback to Node.js crypto |
| React Native performance with 2200-line hook       | Medium | Medium      | Extract sub-hooks, memo aggressively, profile early    |
| NativeWind incompatibility with complex Tailwind   | Low    | Medium      | Fallback to StyleSheet.create for complex styles       |
| App Store rejection (encryption export compliance) | High   | Low         | File ERN (Encryption Registration Number) with Apple   |
| SQLite migration complexity                        | Medium | Medium      | Version migration system from day 1                    |
| Expo managed workflow limitations                  | Medium | Low         | Eject to bare workflow if needed (Expo supports both)  |

---

## Part 9: API Architecture for Mobile

The current Vercel serverless API works for mobile with no changes:

```
Mobile App → HTTPS → Vercel Edge → /api/gemini → Gemini/OpenAI
```

**Considerations:**

- Same API endpoint for web and mobile
- Add `User-Agent` header to distinguish platforms (for analytics)
- Consider adding API versioning (`/api/v1/gemini`) for backward compatibility
- Rate limiting already exists (30 req/min/IP)

**Future Enhancement:** If user count grows past 100K, consider:

- API key per user (instead of shared Gemini key)
- WebSocket for real-time AI streaming (reduce polling)
- Edge caching for repeated context builds

---

## Part 10: Summary

### What Makes This Plan Production-Ready

1. **Monorepo-first** — Shared logic from day 1, not an afterthought
2. **Adapter pattern** — Clean separation of platform concerns
3. **Mobile-native UX** — Not a responsive web port; gesture-first, touch-first design
4. **Same security model** — AES-256-GCM, zero-knowledge, biometric as convenience layer
5. **Incremental delivery** — Each phase produces a usable app; no big bang

### Total Estimated Scope

| Phase              | Duration        | Deliverable                      |
| ------------------ | --------------- | -------------------------------- |
| 0: Monorepo        | 1 week          | Shared packages, web still works |
| 1: Foundation      | 2-3 weeks       | Vault unlock, empty shell        |
| 2: Core UX         | 3-4 weeks       | Dashboard, logging, tasks        |
| 3: Full Parity     | 2-3 weeks       | All tabs functional              |
| 4: Native Features | 2 weeks         | Notifications, voice, widgets    |
| 5: Polish          | 1-2 weeks       | Performance, a11y, launch        |
| **Total**          | **11-15 weeks** | **Production mobile app**        |
