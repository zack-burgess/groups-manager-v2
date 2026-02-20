# V1: Login + Profile — Implementation Plan

## Overview

Implement the first vertical slice of the Groups Manager app: project scaffolding, data layer, and the Login → Setup → Profile flow. At the end of this slice, a visitor can sign in as a known person (welcome-back path), an unknown person (setup path), or receive a suspended-account message. The profile page shows name, email, title, org, and group memberships.

---

## Current State Analysis

Greenfield — no code exists. Only specs exist in `specs/`.

Tech stack (resolved in Q6): **Vite + React + TypeScript + Tailwind CSS**. Local dev only for V1; GitHub Pages deployment deferred.

---

## Desired End State

A locally runnable app (`npm run dev`) where:

1. Visiting `/` shows the Login page with a name input pre-filled with "me"
2. Typing "Alice Chen" and clicking Sign In shows "Welcome back, Alice Chen!" then navigates to her profile
3. Typing "Zack Burgess" and clicking Sign In shows "Welcome back, Zack Burgess!" then navigates to his profile
4. Typing a suspended person's name shows a suspended-account message and blocks entry
5. Typing an unknown name (e.g. "Sam Fox") navigates to the Setup page with title/org dropdowns; completing setup creates the person and lands on their profile
6. The profile page shows name, email, title, org, and a list of groups with role badges
7. Group membership rows and "+ Create a group" are rendered but clicking them does nothing (stubs for V3/V6)
8. The app header shows only a logo/home link (no search, no settings yet)
9. Refreshing the app preserves the session and returns to the profile page
10. Seed data is present in localStorage from first load

### Key Discoveries

- All data lives in localStorage — no server, no API calls
- `initializeStorage()` (N50) seeds localStorage from S8 on first load; no-op on return
- Session is stored in S9 (`currentSession: {personId}`) — persists across refreshes
- Every known person in seed data has title + org set; the new-person path handles the only case where they don't

---

## What We're NOT Doing in V1

- Search (V2), Group Detail (V3), Membership Actions (V4), Employee Management (V5), Create/Edit Group (V6), AM Rule Editor (V7–V8), About/Reset (V9)
- Settings dropdown or logout
- Header search input
- Clicking a group row from the profile (stub — no navigation)
- GitHub Pages deployment or CI/CD

---

## Implementation Approach

Five sequential phases. Each phase leaves the app in a runnable state.

**State management:** Direct localStorage reads/writes via a thin service layer. React state (`useState`, `useEffect`) at the component level. React Router for page navigation. No external state library.

**Folder structure:**
```
src/
  types/         — TypeScript interfaces (Person, Group, Membership, etc.)
  data/          — seedData constant (S8)
  services/      — localStorage read/write functions (one file per store)
  pages/         — LoginPage, SetupPage, ProfilePage
  components/    — AppHeader, GroupMembershipRow
  App.tsx        — Router setup + initializeStorage() call
  main.tsx       — Entry point
```

---

## Phase 1: Project Scaffolding

### Overview

Bootstrap the Vite + React + TypeScript + Tailwind project, wire up React Router, and verify the dev server runs.

### Changes Required

#### 1. Initialize Vite project

```bash
npm create vite@latest . -- --template react-ts
npm install
```

#### 2. Install dependencies

```bash
npm install react-router-dom
npm install -D tailwindcss @tailwindcss/vite
```

#### 3. Configure Tailwind

**File:** `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**File:** `src/index.css`
```css
@import "tailwindcss";
```

#### 4. Wire up React Router

**File:** `src/App.tsx`
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Login</div>} />
        <Route path="/setup" element={<div>Setup</div>} />
        <Route path="/profile/:personId" element={<div>Profile</div>} />
      </Routes>
    </BrowserRouter>
  )
}
```

#### 5. Clean up Vite boilerplate

Remove `src/assets/react.svg`, `public/vite.svg`, and the default CSS content from `src/App.css`. Keep `src/index.css` for Tailwind only.

### Success Criteria

#### Automated Verification
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` compiles without errors
- [ ] `npm run typecheck` (add `"typecheck": "tsc --noEmit"` to package.json scripts) passes

#### Manual Verification
- [ ] Browser opens to `http://localhost:5173` and shows "Login" text
- [ ] No console errors on load

---

## Phase 2: Data Layer

### Overview

Define all TypeScript types, write the seed data constant (S8), and implement localStorage service functions for all stores used in V1: S1 (people), S2 (groups), S3 (memberships), S4 (changeEvents), S6 (titles), S7 (orgs), S8 (seedData), S9 (currentSession).

### Changes Required

#### 1. TypeScript types

**File:** `src/types/index.ts`
```ts
export type PersonStatus = 'ACTIVE' | 'SUSPENDED'
export type MemberRole = 'MEMBER' | 'ADMIN'
export type MembershipSetting = 'ADMIN_ONLY' | 'OPEN'
export type ActorType = 'PERSON' | 'AUTOMATIC_MEMBERSHIP'

export interface Person {
  id: string
  name: string
  email: string
  title: string
  organization: string
  status: PersonStatus
  isSystemAdmin: boolean
}

export interface Group {
  id: string
  name: string
  description: string
  membershipSetting: MembershipSetting
}

export interface Membership {
  groupId: string
  personId: string
  role: MemberRole
  addedAt: string   // ISO timestamp
  addedBy: string   // personId or 'SYSTEM'
}

export interface ChangeEvent {
  id: string
  groupId: string | null
  actorType: ActorType
  actorId: string | null
  eventType: string
  payload: Record<string, unknown>
  timestamp: string
}

export interface AutoMembershipRule {
  groupId: string
  conditions: Condition[]
  combinator: 'AND' | 'OR'
  triggerOnUpdate: boolean
}

export interface Condition {
  field: 'title' | 'organization' | 'email'
  operator: 'is' | 'is_not' | 'is_one_of' | 'is_not_one_of' | 'contains' | 'does_not_contain'
  value: string | string[]
}

export interface Session {
  personId: string
}

export interface SeedData {
  people: Person[]
  groups: Group[]
  memberships: Membership[]
  changeEvents: ChangeEvent[]
  autoMembershipRules: AutoMembershipRule[]
}
```

#### 2. Seed data

**File:** `src/data/seedData.ts`

The full seed dataset per the spec. Exact IDs use short UUIDs (hardcoded strings — no runtime generation needed for seed).

13 people (one per title), 6 groups (All Employees, Engineers, R&D, Product, Design, Recruiting), all memberships, pre-seeded AM history ChangeEvents for Engineers/R&D/Design showing `actorType: AUTOMATIC_MEMBERSHIP`, and AM rules for all groups with rules.

People:
```ts
const PEOPLE: Person[] = [
  { id: 'p1', name: 'Zack Burgess', email: 'zack.burgess@hey.com', title: 'Product Manager and Builder', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: true },
  { id: 'p2', name: 'Alice Chen', email: 'alice.chen@acme.com', title: 'Software Engineer', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p3', name: 'Marcus Webb', email: 'marcus.webb@acme.com', title: 'Senior Software Engineer', organization: 'Security', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p4', name: 'Jordan Park', email: 'jordan.park@acme.com', title: 'Engineering Manager', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p5', name: 'Sofia Rodriguez', email: 'sofia.rodriguez@acme.com', title: 'Product Manager', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p6', name: 'Emily Torres', email: 'emily.torres@acme.com', title: 'Designer', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p7', name: 'Aisha Patel', email: 'aisha.patel@acme.com', title: 'UX Researcher', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p8', name: "Ryan O'Brien", email: 'ryan.obrien@acme.com', title: 'Recruiter', organization: 'Recruiting', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p9', name: 'Chris Lee', email: 'chris.lee@acme.com', title: 'Data Analyst', organization: 'Data & Analytics', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p10', name: 'James Wilson', email: 'james.wilson@acme.com', title: 'Marketing Manager', organization: 'Marketing', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p11', name: 'Ethan Davis', email: 'ethan.davis@acme.com', title: 'Account Executive', organization: 'Sales', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p12', name: 'Hannah Thompson', email: 'hannah.thompson@acme.com', title: 'HR Manager', organization: 'Human Resources', status: 'ACTIVE', isSystemAdmin: false },
  { id: 'p13', name: 'Noah Garcia', email: 'noah.garcia@acme.com', title: 'Legal Counsel', organization: 'Legal', status: 'ACTIVE', isSystemAdmin: false },
]
```

Groups (IDs: g1=All Employees, g2=Engineers, g3=R&D, g4=Product, g5=Design, g6=Recruiting).

Memberships per spec seed groups table.

Pre-seeded ChangeEvents: at least 2–3 past AM-initiated additions per group that has rules (Engineers, R&D, Design) — use timestamps in 2025 to look like history.

AM rules:
- All Employees: `email contains "@"`, combinator AND, triggerOnUpdate false
- Engineers: `title is_one_of [Software Engineer, Senior Software Engineer, Engineering Manager]`, AND, triggerOnUpdate true
- R&D: `organization is "Research and Development"`, AND, triggerOnUpdate false
- Product: `title is_one_of [Product Manager, Product Manager and Builder]`, AND, triggerOnUpdate false
- Design: `title is_one_of [Designer, UX Researcher]`, AND, triggerOnUpdate true

#### 3. Static lookup lists

**File:** `src/data/lookups.ts`
```ts
export const PREDEFINED_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Engineering Manager',
  'Product Manager',
  'Product Manager and Builder',
  'Designer',
  'UX Researcher',
  'Recruiter',
  'Data Analyst',
  'Marketing Manager',
  'Account Executive',
  'HR Manager',
  'Legal Counsel',
]

export const PREDEFINED_ORGS = [
  'Research and Development',
  'Marketing',
  'Sales',
  'Human Resources',
  'Legal',
  'Recruiting',
  'Security',
  'Data & Analytics',
]
```

#### 4. localStorage service

**File:** `src/services/storage.ts`

Storage keys as constants. Functions:

```ts
// Keys
const KEYS = {
  people: 'gm_people',
  groups: 'gm_groups',
  memberships: 'gm_memberships',
  changeEvents: 'gm_changeEvents',
  autoMembershipRules: 'gm_autoMembershipRules',
  session: 'gm_session',
}

// Generic helpers
function read<T>(key: string): T | null
function write<T>(key: string, value: T): void

// N50: initializeStorage() — seeds from S8 if empty
export function initializeStorage(): void

// S1: people
export function getPeople(): Person[]
export function savePeople(people: Person[]): void

// S2: groups
export function getGroups(): Group[]
export function saveGroups(groups: Group[]): void

// S3: memberships
export function getMemberships(): Membership[]
export function saveMemberships(memberships: Membership[]): void

// S4: changeEvents
export function getChangeEvents(): ChangeEvent[]
export function saveChangeEvents(events: ChangeEvent[]): void

// S5: autoMembershipRules
export function getAutoMembershipRules(): AutoMembershipRule[]
export function saveAutoMembershipRules(rules: AutoMembershipRule[]): void

// S9: session
export function getSession(): Session | null
export function saveSession(session: Session): void
export function clearSession(): void
```

#### 5. Person service functions

**File:** `src/services/people.ts`

```ts
// N1: lookupPerson(name) — case-insensitive name match against S1
export function lookupPerson(name: string): Person | null

// N3: generateEmail(name) — firstname.lastname@acme.com
// Strips non-alpha, lowercases, handles names with apostrophes (O'Brien → obrien)
export function generateEmail(name: string): string

// N10: loadPerson(id)
export function loadPerson(id: string): Person | null

// N8: createEmployee(name, email, title, org) — writes to S1, returns new Person
export function createEmployee(name: string, email: string, title: string, org: string): Person

// N9: writeChangeEvent(EMPLOYEE_CREATED)
export function writeEmployeeCreatedEvent(personId: string): void
```

#### 6. Membership service functions

**File:** `src/services/memberships.ts`

```ts
// N11: loadPersonMemberships(personId) — returns [{group, role}]
export function loadPersonMemberships(personId: string): Array<{ group: Group; role: MemberRole }>
```

#### 7. Call initializeStorage from App

**File:** `src/App.tsx`

Call `initializeStorage()` at the top of App before rendering routes. Also check session and redirect to profile if already logged in.

### Success Criteria

#### Automated Verification
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run build` compiles cleanly
- [ ] Opening browser to `http://localhost:5173`, then checking `localStorage` in DevTools shows all seed keys (`gm_people`, `gm_groups`, etc.) populated

#### Manual Verification
- [ ] DevTools → Application → Local Storage shows 13 people, 6 groups after first load
- [ ] Hard-refreshing preserves the data (no re-seed wipes existing data)
- [ ] Clearing localStorage manually and refreshing re-seeds fresh data

---

## Phase 3: Login Page (P1)

### Overview

Implement the Login page with name input (pre-filled "me"), Sign In button, and the three-way branch: known+active → welcome-back + navigate to profile; suspended → blocked message; unknown → navigate to setup.

### Changes Required

#### 1. LoginPage component

**File:** `src/pages/LoginPage.tsx`

```tsx
// State: name (string), loginState ('idle' | 'welcome' | 'suspended')
// On mount: if session exists, redirect to /profile/:personId
// Sign In click:
//   1. lookupPerson(name)
//   2. if ACTIVE: set loginState='welcome', save session, after 1.5s navigate to /profile/:id
//   3. if SUSPENDED: set loginState='suspended'
//   4. if null: generateEmail(name), navigate to /setup with state {name, email}
// UI: centered card, name input, Sign In button, conditional messages
```

Renders:
- Name text input, pre-filled with `"me"`, clears on focus if value is `"me"`
- Sign In button (disabled while empty)
- `loginState === 'welcome'`: "Welcome back, [Name]!" message in green
- `loginState === 'suspended'`: "This account has been suspended." message in red

#### 2. Register LoginPage in router

**File:** `src/App.tsx` — replace `<div>Login</div>` with `<LoginPage />`

### Success Criteria

#### Automated Verification
- [ ] `npm run typecheck` passes
- [ ] `npm run build` compiles

#### Manual Verification
- [ ] Typing "Alice Chen" → Sign In shows "Welcome back, Alice Chen!" then redirects to `/profile/p2`
- [ ] Typing "Zack Burgess" → Sign In redirects to `/profile/p1`
- [ ] Typing a suspended person's name (none in seed; can test by manually setting status in localStorage) → shows suspended message
- [ ] Typing "Sam Fox" → navigates to `/setup`
- [ ] Visiting `/` when already logged in (session in localStorage) redirects to profile without showing Login

---

## Phase 4: Setup Page (P2)

### Overview

Implement the First-Time Setup page. Receives name + generated email from Login. Shows title and org dropdowns. Complete Setup creates the employee, saves session, and navigates to their profile.

### Changes Required

#### 1. SetupPage component

**File:** `src/pages/SetupPage.tsx`

```tsx
// Reads {name, email} from router location state (passed by LoginPage)
// If no location state: redirect to /
// State: selectedTitle (string), selectedOrg (string)
// N4: loadTitleOptions() → PREDEFINED_TITLES
// N5: loadOrgOptions() → PREDEFINED_ORGS
// N6/N7: Complete Setup button enabled only when both title + org selected
// N8 on submit: createEmployee(name, email, title, org) → saves to S1, writes EMPLOYEE_CREATED ChangeEvent, saves session, navigate to /profile/:id
// Back button → navigate to /
```

Renders:
- Read-only display of name + generated email
- Title dropdown (`<select>` from PREDEFINED_TITLES)
- Organization dropdown (`<select>` from PREDEFINED_ORGS)
- Complete Setup button (disabled until both selected)
- Back button

#### 2. Register SetupPage in router

**File:** `src/App.tsx` — replace `<div>Setup</div>` with `<SetupPage />`

### Success Criteria

#### Automated Verification
- [ ] `npm run typecheck` passes
- [ ] `npm run build` compiles

#### Manual Verification
- [ ] Typing "Sam Fox" on login → setup page shows name "Sam Fox" and email "sam.fox@acme.com"
- [ ] Complete Setup button disabled until title AND org selected
- [ ] Completing setup navigates to `/profile/:newId`
- [ ] New person appears in localStorage `gm_people`
- [ ] Back button returns to login page
- [ ] Visiting `/setup` directly without login state redirects to `/`

---

## Phase 5: Profile Page (P3) + Partial Header

### Overview

Implement the Profile page showing all person fields and their group membership list. Add the partial app header (logo/home link only). Group rows are rendered but clicking them is a stub (no navigation yet).

### Changes Required

#### 1. AppHeader component (partial)

**File:** `src/components/AppHeader.tsx`

```tsx
// Props: none (reads session from localStorage to get currentPersonId for home link)
// Logo / home link → navigate to /profile/:currentPersonId (H1)
// No search input, no settings dropdown yet (V2, V5)
```

Renders:
- Left: app name "Groups Manager" as a link to own profile
- Right: placeholder text or nothing (future: search + settings)

#### 2. ProfilePage component

**File:** `src/pages/ProfilePage.tsx`

```tsx
// Reads :personId from route params
// On mount: loadPerson(id), loadPersonMemberships(id)
// If person not found: redirect to /
// N10: renders name, email, title, organization
// N11: renders group membership list (group name + role badge)
// U15: group row click → stub (no-op or console.log for now)
// U73: "+ Create a group" link → stub (no-op)
// Back button (U9) → navigate(-1) — only shown when viewing someone else's profile
//   (when viewing own profile, no back button — there's nowhere to go back to yet)
```

Renders:
- AppHeader
- Person fields: name, email, title, organization
- Group memberships section: list of rows with group name and role badge (ADMIN / MEMBER)
- "+ Create a group" at bottom of group list (stub, no click handler wired yet)

#### 3. Role badge component

Inline within ProfilePage or a tiny shared component: `<span>` with Tailwind styling. ADMIN badge = amber/orange. MEMBER badge = gray.

#### 4. Register ProfilePage in router

**File:** `src/App.tsx` — replace `<div>Profile</div>` with `<ProfilePage />`

#### 5. Session guard in App

**File:** `src/App.tsx`

If a route other than `/` or `/setup` is accessed without a session, redirect to `/`.

### Success Criteria

#### Automated Verification
- [ ] `npm run typecheck` passes
- [ ] `npm run build` compiles

#### Manual Verification
- [ ] Logging in as Alice Chen shows: name "Alice Chen", email "alice.chen@acme.com", title "Software Engineer", org "Research and Development"
- [ ] Alice's group list shows: All Employees (MEMBER), Engineers (MEMBER), R&D (MEMBER) — per seed memberships
- [ ] Logging in as Jordan Park shows Engineers (ADMIN) role badge
- [ ] Logging in as Zack Burgess shows his custom email `zack.burgess@hey.com` (not auto-generated)
- [ ] Logo link in header navigates to own profile
- [ ] "+ Create a group" is visible but clicking does nothing
- [ ] Group membership rows are visible but clicking does nothing
- [ ] Refreshing the profile page keeps you on the profile (session persists)
- [ ] Visiting `/profile/p99` (non-existent ID) redirects to `/`

---

## Testing Strategy

### Manual Testing Walkthrough (V1 Demo Script)

1. Clear localStorage. Load `http://localhost:5173`. Verify seed data present.
2. Type "Alice Chen" → Sign In → welcome message → profile with correct fields and groups.
3. Type "Zack Burgess" → Sign In → profile with custom email and system-admin indicator.
4. Logout by clearing `gm_session` in DevTools → returns to login (or just navigate to `/`).
5. Type "Sam Fox" → setup page → select title "Data Analyst", org "Sales" → Complete Setup → profile for Sam Fox, email "sam.fox@acme.com".
6. Verify Sam Fox is in localStorage `gm_people`.
7. Manually set a person's status to "SUSPENDED" in localStorage → type their name → see suspended message.
8. Close and reopen tab → session persists → still on profile.

---

## References

- Slice spec: `specs/groups-manager-slices.md` (V1 section)
- Breadboard: `specs/groups-manager-breadboard.md`
- Shaping doc: `specs/groups-manager-shaping.md`
- Spike A3: `specs/spike-a3.md`
