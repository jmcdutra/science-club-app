# Science Club App — Claude Context

## Project overview
React Native + Expo app for the Science Club fitness coaching platform. Students follow personalized workouts, log diet & hydration, complete physical assessments, and track history. All copy is **Portuguese (BR)**.

Stack: Expo SDK 52, Expo Router (file-based), NativeWind v4 (Tailwind), Phosphor Icons (`phosphor-react-native`), React Native Reanimated v3, TanStack Query.

## Design system
**Full reference:** `../science-club-design-system/SKILL.md` — read this before any UI work.

Non-negotiable rules (condensed):
- Dark mode is default. `bg-bg-base` (#000), `bg-bg-surface` (#111), `border-border-subtle` (#222).
- One brand purple: `#8B5CF6` (`brand-primary`). Never invent new purples.
- Macro colors fixed: Calorias `#8B5CF6` · Proteína `#38BDF8` · Carbs `#F59E0B` · Gorduras `#FB7185` · Hidratação `#22D3EE`.
- Two fonts only: `font-heading` = Outfit (headings/display), `font-sans` = Inter (body/numbers).
- Eyebrows: `text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]` — above every section.
- Numbers: bold value + smaller muted unit suffix. Brazilian locale (`2.450`, not `2,450`).
- Corners: `rounded-xl` (12) inputs/chips · `rounded-2xl` (16) cards · `rounded-3xl` (24) hero cards · `rounded-full` chips/badges.
- Primary CTAs always carry shadow: `shadow-lg shadow-brand-primary/30` (purple glow). No flat brand buttons.
- Icons: Phosphor, 20–24px body, 16px buttons, `regular` weight inactive, `fill` weight active.
- Section header eyebrow + `border-b border-border-subtle pb-4 mb-8` divider pattern.
- Typography: `text-2xl font-bold` max for section titles. NEVER `font-black` or `font-extrabold`. NEVER `text-5xl`+.
- No emoji in product UI. No English copy.

## File structure
```
app/(app)/(tabs)/         — Tab screens (home, workouts, diet, assessments, history, profile)
app/(app)/workouts/[id]/  — WorkoutSheetDetailScreen, session, finish
app/(app)/assessments/    — Assessment detail + sub-screens
src/features/             — Feature code (screens, API, stores)
  home/screens/HomeScreen.tsx
  workouts/api/workouts.ts   getCurrentWorkout()
  diet/api/diet.ts           getCurrentDiet()
  assessments/api/assessments.ts
  auth/services/auth.store.ts  useAuthStore() → session.name, session.token, session.released_questionnaire
src/shared/components/
  layout/AppShell.tsx        — Standard scrollable screen with header
  ui/AppText.tsx             — Text component with variants
```

## Navigation patterns
- Workout session: `router.push(\`/(app)/workouts/${id}/session?sessionId=${sessionId}\` as Href)`
- Assessment: `router.push(\`/(app)/assessments/${evalData.id}\` as Href)`

## Working API endpoints
- `getCurrentWorkout(token)` → `{ workout, todaySessionId, hasAccess, progressBySession }`
- `getCurrentDiet(token)` → `{ diet, dayLog, hasAccess }`
- `getStudentEvaluations(token)` → `EvaluationDTO[]`
- `createEvaluation(token, questionnaireId)` → `{ id }`

## Screens already redesigned
- HomeScreen (redesigned per UI Kit — custom header, week strip, hero workout card, stats grid)
- WorkoutSheetsScreen, WorkoutSheetDetailScreen, WorkoutSessionScreen, WorkoutFinishScreen
