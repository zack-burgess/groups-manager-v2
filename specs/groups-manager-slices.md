---
shaping: true
---

# Groups Manager — Slices

## Slice Summary

| # | Slice | Shape Parts | Demo |
|---|-------|-------------|------|
| V1 | Login + Profile | A1, A2, A9, A10 | Sign in as Alice Chen, land on your profile with groups listed |
| V2 | Search + Navigation | A4 | Search "eng", see one-line results, click through to profile and group |
| V3 | Group Detail (read) | A5, A7 | View Engineers — member list, history feed, AM panel showing "Not configured" |
| V4 | Membership Actions | A6 | Add a member inline, promote to admin, remove — history updates |
| V5 | Employee Management | A3 | Settings dropdown; update Alice (email updates live), suspend, rehire |
| V6 | Create + Edit Group | A5.4, A5.5 | Create a group from profile; edit its name and membership setting |
| V7 | AM Rule Editor | A8.1, A8.2 | Build a filter, see Missing Members, Add Now, ✕ to undo, save rules |
| V8 | AM Evaluation | A8.3, A8.4 | Create employee matching Engineers rule — auto-added; AM panel shows rule summary |
| V9 | About + Reset | A10.2, A11 | View About page; Reset Demo returns to fresh seed state |

---

## V1: Login + Profile

**Demo:** Sign in as "Alice Chen" → welcome-back message → profile page with name, email, title, org, and group list. Sign in as an unknown name → setup screen → profile.

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U1 | P1 | login | Name text input (pre-filled "me") | type | — | — |
| U2 | P1 | login | Sign In button | click | → N1 | — |
| U3 | P1 | login | Welcome-back message "Welcome back, [Name]!" | render | → P3 | — |
| U4 | P1 | login | Suspended account message | render | — | — |
| U5 | P2 | setup | Back button | click | → P1 | — |
| U6 | P2 | setup | Title dropdown | select | → N7 | — |
| U7 | P2 | setup | Organization dropdown | select | → N7 | — |
| U8 | P2 | setup | Complete Setup button | click | → N8 | — |
| U10 | P3 | profile | Name | render | — | — |
| U11 | P3 | profile | Email | render | — | — |
| U12 | P3 | profile | Title | render | — | — |
| U13 | P3 | profile | Organization | render | — | — |
| U14 | P3 | profile | Group memberships list | render | — | — |
| U15 | P3 | profile | Group membership row (group name + role badge) | click | → P5 (stub) | — |
| U73 | P3 | profile | + Create a group | click | → P10 (stub) | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N50 | App | app | `initializeStorage()` — seeds localStorage from S8 if empty | call | → S8 | → P1 |
| N1 | P1 | login | `lookupPerson(name)` | call | → N2 | — |
| N2 | P1 | login | name match decision | conditional | → U3 + S9 (ACTIVE), → U4 (SUSPENDED), → N3 + P2 (unknown) | — |
| N3 | P1 | login | `generateEmail(name)` | call | — | → P2 |
| N4 | P2 | setup | `loadTitleOptions()` | call | — | → U6 |
| N5 | P2 | setup | `loadOrgOptions()` | call | — | → U7 |
| N6 | P2 | setup | `validateSetup(title, org)` | call | — | → U8 enabled/disabled |
| N7 | P2 | setup | setup state (title + org selected) | observe | — | → N6 |
| N8 | P2 | setup | `createEmployee(name, email, title, org)` | call | → S1, → N9, → S9 | — |
| N9 | P2 | setup | `writeChangeEvent(EMPLOYEE_CREATED)` | call | → S4 | → P3 |
| N10 | P3 | profile | `loadPerson(id)` | call | → S1 | → U10, U11, U12, U13 |
| N11 | P3 | profile | `loadPersonMemberships(id)` | call | → S3, S2 | → U14 |

### Header (partial)

| # | Component | Affordance | Control | Wires Out | Returns To |
|---|-----------|------------|---------|-----------|------------|
| H1 | app-header | Logo / home link | click | → P3 (own profile) | — |

### Stores Introduced

| # | Store | Description |
|---|-------|-------------|
| S1 | `people` | `{id, name, email, title, organization, status, isSystemAdmin}[]` |
| S2 | `groups` | `{id, name, description, membershipSetting}[]` |
| S3 | `memberships` | `{groupId, personId, role, addedAt, addedBy}[]` |
| S4 | `changeEvents` | `{id, groupId, actorType, actorId, eventType, payload, timestamp}[]` |
| S6 | `predefinedTitles` | Static list — 13 titles |
| S7 | `predefinedOrgs` | Static list — 8 organizations |
| S8 | `seedData` | 13 people, 6 groups, memberships, AM rules, history |
| S9 | `currentSession` | `{personId}` — currently logged-in person |

---

## V2: Search + Navigation

**Demo:** Type "eng" in the header search → results page shows one-line people and group rows → click Alice Chen → her profile → click back → click Engineers → group detail (stub from V3).

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U9 | P3 | profile | Back button | click | → P4 | — |
| U16 | P4 | search | Search input (pre-filled with query) | type | → N12 | — |
| U17 | P4 | search | Results list | render | — | — |
| U18 | P4 | search | Person result row (name, title, org — one line) | click | → P3 | — |
| U19 | P4 | search | Group result row (name, description — one line) | click | → P5 (stub) | — |
| U20 | P4 | search | No results message | render | — | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N12 | P4 | search | `performSearch(query)` | call | → S1, S2 | → N13 |
| N13 | P4 | search | `searchResults` store | write | — | → U17, U18, U19, U20 |

### Header (additions)

| # | Component | Affordance | Control | Wires Out | Returns To |
|---|-----------|------------|---------|-----------|------------|
| H2 | app-header | Search input | submit | → P4 | — |

### Stores Introduced

| # | Store | Description |
|---|-------|-------------|
| S10 | `searchResults` | Transient — `{type: 'person'|'group', ...}[]` — in-memory only |

---

## V3: Group Detail (read)

**Demo:** Click Engineers from search → group detail with name, description, membership setting, AM panel ("Not configured"), Members tab with count and list, History tab with one-line entries.

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U21 | P5 | group-detail | Back button | click | → previous place | — |
| U22 | P5 | group-detail | Group name | render | — | — |
| U23 | P5 | group-detail | Group description | render | — | — |
| U24 | P5 | group-detail | Membership setting badge (ADMIN\_ONLY \| OPEN) | render | — | — |
| U39 | P5 | group-detail | AM panel (rule summary or "Not configured") | render | — | — |
| U40 | P5 | group-detail | Edit Rules button (admin only, stub) | click | → P6 (stub) | — |
| U26 | P5 | group-detail | Members tab | click | — (local tab state) | — |
| U27 | P5 | group-detail | History tab | click | — (local tab state) | — |
| U28 | P5 | group-detail | Member count | render | — | — |
| U35 | P5 | group-detail | Member list | render | — | — |
| U36 | P5 | group-detail | Member row (name, role badge) | render | — | — |
| U41 | P5 | group-detail | History feed | render | — | — |
| U42 | P5 | group-detail | History event row ("[Person] [action] by [actor] — [date]") | render | — | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N14 | P5 | group-detail | `loadGroup(id)` | call | → S2 | → U22, U23, U24, U28 |
| N15 | P5 | group-detail | `loadGroupMembers(id)` | call | → S3, S1 | → U35 |
| N16 | P5 | group-detail | `loadGroupHistory(id)` | call | → S4 | → U41 |
| N21 | P5 | group-detail | `loadGroupRules(groupId)` | call | → S5 | → U39 |

### Stores Introduced

| # | Store | Description |
|---|-------|-------------|
| S5 | `autoMembershipRules` | `{groupId, conditions, combinator, triggerOnUpdate}[]` |

---

## V4: Membership Actions

**Demo:** Add a member inline (type to search, click Add), promote to admin, remove — history feed updates after each action. Last-admin guard blocks demoting the only admin.

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U25 | P5 | group-detail | Change Setting toggle (admin only) | click | → N17 | — |
| U74 | P5 | group-detail | Edit Group button (admin only, stub) | click | → P10 (stub) | — |
| U29 | P5 | group-detail | + Add a member (resting row at bottom of list) | click | — (opens inline input) | — |
| U30 | P5 | group-detail | Inline search input | type | → N23 | — |
| U31 | P5 | group-detail | Inline search results (non-members only) | render | — | — |
| U32 | P5 | group-detail | Inline person row (name, title, org) | render | — | — |
| U33 | P5 | group-detail | Inline Add button (per person row) | click | → N24 | — |
| U34 | P5 | group-detail | Inline close (blur / Escape) | click | — (closes inline input) | — |
| U37 | P5 | group-detail | Remove button (admin or self) | click | → N18 | — |
| U38 | P5 | group-detail | Promote / Demote button (admin only, last-admin guard) | click | → N19 | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N17 | P5 | group-detail | `changeGroupSetting(groupId, setting)` | call | → S2, → N20 | — |
| N18 | P5 | group-detail | `removeMember(groupId, personId)` | call | → S3, → N20 | — |
| N19 | P5 | group-detail | `changeMemberRole(groupId, personId, role)` | call | → S3, → N20, → last-admin guard | — |
| N20 | P5 | group-detail | `writeChangeEvent(event)` | call | → S4 | → U41 (reload) |
| N22 | P5 | group-detail | `checkAddMemberPermission(groupId, actorId)` | call | — | → U29 visible/hidden |
| N23 | P5 | group-detail | `searchNonMembers(groupId, query)` | call | → S1, S3 | → U31 |
| N24 | P5 | group-detail | `addMember(groupId, personId, addedBy)` | call | → S3, → N20 | → U35 reload |

---

## V5: Employee Management

**Demo:** Open Settings → Manage Employees; update Alice Chen — type "Alice Smith", watch email update live to alice.smith@acme.com; suspend an employee; rehire a suspended employee; create a new employee via setup flow; logout.

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U57 | P7 | employee-mgmt | Active employees list | render | — | — |
| U58 | P7 | employee-mgmt | Active employee row (name, title, org — one line) | render | — | — |
| U59 | P7 | employee-mgmt | Update button (per row, hidden for Zack) | click | → P7.1 | — |
| U60 | P7 | employee-mgmt | Suspend button (per row, hidden for Zack) | click | → N35 | — |
| U61 | P7 | employee-mgmt | Create Employee button | click | → P2 | — |
| U62 | P7 | employee-mgmt | Suspended employees section | render | — | — |
| U63 | P7 | employee-mgmt | Suspended employee row (name, title, org — one line) | render | — | — |
| U64 | P7 | employee-mgmt | Rehire button (per suspended row) | click | → N37 | — |
| U65 | P7 | employee-mgmt | Back button | click | → P3 (own profile) | — |
| U66 | P7.1 | update-employee | Name input (pre-filled) | type | → N49 | — |
| U82 | P7.1 | update-employee | Email (read-only, auto-derives from name; updates live) | render | — | — |
| U67 | P7.1 | update-employee | Title dropdown (pre-filled) | select | — | — |
| U68 | P7.1 | update-employee | Organization dropdown (pre-filled) | select | — | — |
| U69 | P7.1 | update-employee | Update button | click | → N41 | — |
| U70 | P7.1 | update-employee | Cancel button | click | → P7 | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N32 | P7 | employee-mgmt | `loadAllEmployees()` | call | → S1 | → U57, U62 |
| N33 | P7 | employee-mgmt | `checkSystemAdminGuard(personId)` | call | — | → U59, U60 hidden/shown |
| N34 | P7 | employee-mgmt | `loadTitleOptions()` / `loadOrgOptions()` | call | → S6, S7 | → U67, U68 |
| N35 | P7 | employee-mgmt | `suspendEmployee(id)` | call | → S1, → N36 | — |
| N36 | P7 | employee-mgmt | `removeFromAllGroups(personId)` | call | → S3, → N20 (per group) | → U57, U62 reload |
| N37 | P7 | employee-mgmt | `rehireEmployee(id)` | call | → S1, → N38 (stub), → N20 | — |
| N40 | P7.1 | update-employee | `loadEmployeeForUpdate(id)` | call | → S1 | → U66, U67, U68, U82 |
| N41 | P7.1 | update-employee | `updateEmployee(id, name, title, org)` | call | → S1, → N42, → N43 (stub) | — |
| N42 | P7.1 | update-employee | `writeChangeEvent(EMPLOYEE_UPDATED)` | call | → S4 | — |
| N49 | P7.1 | update-employee | `deriveEmail(name)` — live email derivation on each name keystroke | call | — | → U82 |
| N44 | App | app | `logout()` | call | → S9 (clear) | → P1 |

### Header (additions)

| # | Component | Affordance | Control | Wires Out | Returns To |
|---|-----------|------------|---------|-----------|------------|
| H3 | app-header | Settings button | click | — (opens dropdown) | — |
| H4 | app-header | Manage Employees | click | → P7 | — |
| H5 | app-header | Reset Demo (stub — wired, not yet functional) | click | → N39 (stub) | — |
| H6 | app-header | Logout | click | → N44 | — |
| H7 | app-header | About (stub — wired, destination in V9) | click | → P8 (stub) | — |

---

## V6: Create + Edit Group

**Demo:** Click "+ Create a group" on profile → fill name, description, setting → land on new group as first admin. Click "Edit Group" on group detail → update name → save.

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U75 | P10 | create-edit-group | Name input (pre-filled if editing) | type | → N46 | — |
| U76 | P10 | create-edit-group | Description input (pre-filled if editing) | type | → N46 | — |
| U77 | P10 | create-edit-group | Who can add members — Admins only / Anyone | select | → N46 | — |
| U78 | P10 | create-edit-group | Create Group / Save Changes button | click | → N47 | — |
| U79 | P10 | create-edit-group | Cancel button | click | → previous place (P3 or P5) | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N45 | P10 | create-edit-group | `loadGroupForEdit(groupId)` — null = create mode | call | → S2 | → U75, U76, U77 |
| N46 | P10 | create-edit-group | form state (name + desc + setting) | observe | — | → U78 enabled/disabled |
| N47 | P10 | create-edit-group | `saveGroup(name, desc, setting, groupId?)` | call | → S2, → N20 | → P5 |

### Stubs activated

- U73 (P3 — + Create a group) → P10 now functional
- U74 (P5 — Edit Group button) → P10 now functional

---

## V7: AM Rule Editor

**Demo:** Open rule editor on Engineers → add a title filter → see Missing Members populate → click Add Now → section re-labels to "Adding (2) ✕" → click ✕ to revert → toggle On Update → Save Rules.

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U43 | P6 (Filters) | rule-editor | Conditions list | render | — | — |
| U44 | P6 (Filters) | rule-editor | Field selector (title / organization / email) | select | → N27 | — |
| U45 | P6 (Filters) | rule-editor | Operator selector | select | → N27 | — |
| U46 | P6 (Filters) | rule-editor | Value input (text or multi-select) | change | → N27 | — |
| U47 | P6 (Filters) | rule-editor | Remove condition button | click | → N27 | — |
| U48 | P6 (Filters) | rule-editor | Add Condition button | click | → N27 | — |
| U49 | P6 (Filters) | rule-editor | AND / OR combinator (appears between conditions when 2+ exist) | click | → N27 | — |
| U52 | P6 (Preview) | rule-editor | Missing Members header + count — switches to "Adding (N) ✕" after Add Now | render | — | — |
| U53 | P6 (Preview) | rule-editor | Preview row (name + values of filter fields) | render | — | — |
| U54 | P6 (Preview) | rule-editor | Add Now button (next to Missing Members header) | click | → N28 | — |
| U80 | P6 (Preview) | rule-editor | ✕ button (clears staged adds, reverts to Missing Members) | click | → N48 | — |
| U81 | P6 (Preview) | rule-editor | Current Members header + count | render | — | — |
| U50 | P6 (Triggers) | rule-editor | On Create / Rehire checkbox (checked, disabled — always on) | render | — | — |
| U51 | P6 (Triggers) | rule-editor | On Update checkbox | click | → N27 | — |
| U55 | P6 (Save) | rule-editor | Save Rules button | click | → N30 | — |
| U56 | P6 (Save) | rule-editor | Cancel button | click | → N31, → P5 | — |

### Code Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N25 | P6 | rule-editor | `loadExistingRules(groupId)` | call | → S5 | → U43, U49, U51 |
| N26 | P6 | rule-editor | `evaluateRules(conditions, combinator, groupId)` | call | → S1, S3, S11 | → U52, U53 |
| N27 | P6 | rule-editor | conditions change handler | observe | → N26 | — |
| N28 | P6 | rule-editor | `bulkAdd(groupId, personIds)` | call | → S11 (draft only) | → U52, U53 reload |
| N29 | P6 | rule-editor | `writeChangeEvents(events, actorType: AUTOMATIC_MEMBERSHIP)` | call | → S4 | — |
| N30 | P6 | rule-editor | `saveRules(groupId, rules)` | call | → S5, → S11→S3, → N29 | → P5 |
| N31 | P6 | rule-editor | `cancelModal()` — discards S11 draft | call | → S11 (clear) | → P5 |
| N48 | P6 | rule-editor | `clearStagedAdds()` — clears S11, reverts Preview to Missing Members | call | → S11 (clear) | → U52, U53 reload |

### Stubs activated

- U40 (P5 — Edit Rules button) → P6 now functional

### Stores Introduced

| # | Store | Description |
|---|-------|-------------|
| S11 | `modalDraft` | Transient — staged bulk-add memberships within AM Rule Editor session; cleared on Save or Cancel |

---

## V8: AM Evaluation

**Demo:** Create a new employee with title "Software Engineer" → they automatically appear in Engineers; update an employee's title to match R&D rule → auto-added to R&D; AM panel on group detail now shows full rule summary.

### Code Affordances (activated from stubs)

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N38 | App | app | `evaluateAutoMembershipOnCreate(personId)` — evaluates all groups with rules | call | → S5, S1, S3 | — |
| N43 | P7.1 | update-employee | `evaluateAutoMembershipOnUpdate(personId)` — only groups where triggerOnUpdate=true | call | → S5, S3, → N29 | → P7 |

### Stubs activated

- N38 (called from N8 on Create and N37 on Rehire) — now fully evaluates rules and writes memberships
- N43 (called from N41 on Update) — now fully evaluates rules for groups with triggerOnUpdate=true
- U39 (AM panel on P5) — now shows live rule summary (conditions, combinator, which triggers are on)

---

## V9: About + Reset

**Demo:** Click About in Settings → about page with portfolio context and links. Click Reset Demo → localStorage cleared, re-seeded, return to login.

### UI Affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| U71 | P8 | about | About page content (app name, purpose, author, links) | render | — | — |
| U72 | P8 | about | Back button | click | → P3 (own profile) | — |

### Code Affordances (activated from stubs)

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|-------|-----------|------------|---------|-----------|------------|
| N39 | App | app | `resetDemo()` — clears localStorage, re-seeds from S8 | call | → S8, → localStorage clear | → P1 |

### Stubs activated

- H5 (Reset Demo) → N39 now functional
- H7 (About) → P8 now functional
