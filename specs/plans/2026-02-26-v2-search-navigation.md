# V2: Search + Navigation — Implementation Plan

## Overview

Add header search, a search results page, and wire up navigation so users can find people and groups by name. Group detail navigates to a stub page (fully implemented in V3). Profile group rows become clickable.

## Current State

V1 delivers Login → Setup → Profile. The `AppHeader` has only a home link (H1). Profile group rows are non-clickable (`cursor-default`). No `/search` or `/group/:id` routes exist.

## Desired End State

**Demo path:** Sign in as Alice Chen → header has a search input → type "eng" → submit → SearchPage shows "Engineers" (group) and "Software Engineer" title matches → click Alice Chen → her profile → back button returns to search results → click Engineers → stub GroupDetailPage.

### Verification
- Searching "eng" returns Alice Chen, Marcus Webb, Jordan Park (title/name hits) and Engineers group
- Searching "xyz" shows no-results message
- Clicking a person row navigates to `/profile/:id`
- Clicking a group row navigates to `/group/:id` (stub page)
- Back button on ProfilePage returns to previous location (search results or wherever)
- Profile group membership rows click through to `/group/:id`
- Header search input is present on all post-login pages (P3, P4)

## What We're NOT Doing

- Real-time / debounced search — submit only (H2 wires to P4 on form submit)
- Suspending search results for SUSPENDED people — search searches all ACTIVE people only
- Group detail implementation — that is V3
- Any localStorage persistence for search state (S10 is transient React state)

---

## Phase 1: Search Service

### Overview
Pure function `performSearch(query)` in a new service file. Searches people (name, title, org) and groups (name, description). Returns typed union results sorted: people first, then groups, each sub-list alphabetical. Only ACTIVE people appear in results.

### Changes Required

#### 1. New file: `src/services/search.ts`

```ts
import { getPeople, getGroups } from './storage'
import type { Person, Group } from '../types'

export interface PersonResult {
  type: 'person'
  person: Person
}

export interface GroupResult {
  type: 'group'
  group: Group
}

export type SearchResult = PersonResult | GroupResult

// N12 / N13: Case-insensitive substring search across people and groups.
// Only ACTIVE people are returned. Results: people first (alpha), then groups (alpha).
export function performSearch(query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const peopleResults: PersonResult[] = getPeople()
    .filter(p =>
      p.status === 'ACTIVE' &&
      (
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.organization.toLowerCase().includes(q)
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(person => ({ type: 'person', person }))

  const groupResults: GroupResult[] = getGroups()
    .filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(group => ({ type: 'group', group }))

  return [...peopleResults, ...groupResults]
}
```

### Success Criteria

#### Automated:
- [ ] TypeScript compiles: `npm run build`

#### Manual:
- [ ] `performSearch('eng')` returns Alice Chen, Marcus Webb, Jordan Park, Engineers (confirmed in browser console or by running the page)
- [ ] `performSearch('xyz')` returns `[]`
- [ ] SUSPENDED person Chris Lee does not appear in results

---

## Phase 2: Header Search Input

### Overview
Add a search `<form>` to `AppHeader` (H2). On submit, navigate to `/search?q=<query>`. Only shown when a session exists (same guard already used for the home link).

### Changes Required

#### 1. Edit `src/components/AppHeader.tsx`

Replace the current minimal header with one that adds a search form between the logo and the right edge. Keep the existing home-link (H1) behavior intact.

```tsx
import { Link, useNavigate } from 'react-router-dom'
import { getSession } from '../services/storage'
import { useState } from 'react'

export default function AppHeader() {
  const session = getSession()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
        <Link
          to={session ? `/profile/${session.personId}` : '/'}
          className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors shrink-0"
        >
          Groups Manager
        </Link>

        {session && (
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people and groups…"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        )}
      </div>
    </header>
  )
}
```

### Success Criteria

#### Automated:
- [ ] TypeScript compiles: `npm run build`

#### Manual:
- [ ] Search input is visible on ProfilePage after login
- [ ] Typing "eng" and pressing Enter navigates to `/search?q=eng`
- [ ] Search input is NOT shown on LoginPage or SetupPage (no session)

---

## Phase 3: Search Results Page

### Overview
New `SearchPage` at `/search`. Reads `?q` from the URL, runs `performSearch`, renders person rows (U18) and group rows (U19). Updates results live as the user types in the on-page input and re-submits. Shows a no-results message (U20) when the list is empty and the query is non-empty.

### Changes Required

#### 1. New file: `src/pages/SearchPage.tsx`

```tsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { performSearch, type SearchResult } from '../services/search'
import { getSession } from '../services/storage'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') ?? ''
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    setResults(performSearch(initialQuery))
  }, [initialQuery, navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {initialQuery && (
            <p className="text-sm text-gray-500 mb-6">
              Results for <span className="font-medium text-gray-800">"{initialQuery}"</span>
            </p>
          )}

          {results.length === 0 && initialQuery && (
            <p className="text-sm text-gray-400">No results found.</p>
          )}

          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map(result => (
                result.type === 'person' ? (
                  <li key={result.person.id}>
                    <button
                      onClick={() => navigate(`/profile/${result.person.id}`)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{result.person.name}</span>
                      <span className="text-sm text-gray-500 ml-2">· {result.person.title} · {result.person.organization}</span>
                    </button>
                  </li>
                ) : (
                  <li key={result.group.id}>
                    <button
                      onClick={() => navigate(`/group/${result.group.id}`)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{result.group.name}</span>
                      <span className="text-sm text-gray-500 ml-2">· {result.group.description}</span>
                    </button>
                  </li>
                )
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
```

#### 2. Add route in `src/App.tsx`

Add `import SearchPage` and a `/search` route (GroupDetailPage stub added in Phase 5).

### Success Criteria

#### Automated:
- [ ] TypeScript compiles: `npm run build`

#### Manual:
- [ ] Navigating to `/search?q=eng` shows Alice Chen, Marcus Webb, Jordan Park, Engineers
- [ ] Navigating to `/search?q=xyz` shows "No results found."
- [ ] Each person row is one line: name · title · org
- [ ] Each group row is one line: name · description
- [ ] Clicking Alice Chen row navigates to her profile
- [ ] Unauthenticated `/search` redirects to `/`

---

## Phase 4: Profile Wiring

### Overview
Two changes to `ProfilePage`:
1. **Back button (U9)** — navigates to the previous location in history. Uses `useNavigate(-1)` with a fallback to `/` if there's no history (e.g., deep-linked directly).
2. **Group membership rows (U15)** — become clickable buttons navigating to `/group/:groupId`.

### Changes Required

#### 1. Edit `src/pages/ProfilePage.tsx`

- Import `useNavigate` (already imported).
- Add a Back button above the profile card (only shown when there's somewhere to go back to — simplest: always show it, navigate(-1)).
- Change group membership `<li>` from a non-interactive element to a `<button>` with `onClick`.

**Back button** (add above the `<div className="bg-white...">` card):
```tsx
<button
  onClick={() => navigate(-1)}
  className="mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
>
  ← Back
</button>
```

**Group row** (replace the static `<li>` with a clickable button):
```tsx
<li key={group.id}>
  <button
    onClick={() => navigate(`/group/${group.id}`)}
    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-sm"
  >
    <span className="text-gray-700 font-medium">{group.name}</span>
    <RoleBadge role={role} />
  </button>
</li>
```

### Success Criteria

#### Automated:
- [ ] TypeScript compiles: `npm run build`

#### Manual:
- [ ] Back button appears on ProfilePage
- [ ] From SearchPage → click Alice Chen → Back button returns to SearchPage with the same query
- [ ] Group membership rows are clickable and navigate to `/group/:groupId`

---

## Phase 5: Group Detail Stub

### Overview
Create a minimal `GroupDetailPage` stub so navigation doesn't 404. Shows group name and a "Coming in V3" note. Registers the `/group/:groupId` route in App.tsx.

### Changes Required

#### 1. New file: `src/pages/GroupDetailPage.tsx`

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getGroups } from '../services/storage'
import { getSession } from '../services/storage'
import type { Group } from '../types'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<Group | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    if (!groupId) {
      navigate('/', { replace: true })
      return
    }
    const found = getGroups().find(g => g.id === groupId) ?? null
    if (!found) {
      navigate('/', { replace: true })
      return
    }
    setGroup(found)
  }, [groupId, navigate])

  if (!group) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h2>
          <p className="text-sm text-gray-500 mb-6">{group.description}</p>
          <p className="text-sm text-gray-400 italic">Group detail coming in V3.</p>
        </div>
      </main>
    </div>
  )
}
```

#### 2. Update `src/App.tsx`

Add imports and routes:
```tsx
import SearchPage from './pages/SearchPage'
import GroupDetailPage from './pages/GroupDetailPage'

// Inside <Routes>:
<Route path="/search" element={<SearchPage />} />
<Route path="/group/:groupId" element={<GroupDetailPage />} />
```

### Success Criteria

#### Automated:
- [ ] TypeScript compiles: `npm run build`

#### Manual:
- [ ] Navigating to `/group/g2` shows "Engineers" group name and description
- [ ] Back button on GroupDetailPage returns to search results
- [ ] Unauthenticated `/group/g2` redirects to `/`

---

## Testing Strategy

### Full V2 Demo Path
1. Sign in as "Alice Chen"
2. Type "eng" in the header search input, press Enter
3. Verify results: Alice Chen, Marcus Webb, Jordan Park (people), Engineers (group)
4. Click Alice Chen → lands on her profile
5. Click Back → returns to `/search?q=eng` with results intact
6. Click Engineers group row → lands on GroupDetailPage stub showing "Engineers"
7. Click Back → returns to search results
8. From Alice's profile, click Engineers membership row → GroupDetailPage

### Edge Cases
- Empty query → header search does nothing (no navigation)
- Direct URL `/search` with no `?q` → empty results, no "no results" message
- Unknown `/group/xyz` → redirect to `/`

## References

- Spec: `specs/groups-manager-slices.md` — V2 section
- Breadboard: `specs/groups-manager-breadboard.md` — P4, H2, U9, U15-U20
- V1 implementation: `src/pages/ProfilePage.tsx`, `src/components/AppHeader.tsx`, `src/App.tsx`
