---
shaping: true
---

# Groups Manager — Shaping

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | 🟡 Login is a single text box pre-filled with "me" as a UI hint; known names always get a welcome-back message (every person in the system has title + org); unknown names auto-generate an email and go through title/org setup before entering the app | Core goal |
| R1 | 🟡 Person profile: name, email, title, organization, status (active/suspended), list of groups; pre-filled with ~12 seed people including Zack Burgess as protected system admin | Core goal |
| R2 | 🟡 Profile management: a persistent header Settings dropdown gives logged-in users access to Manage Employees (Create, Edit, Suspend, Rehire), Reset Demo, Logout, and About; Zack Burgess cannot be suspended or edited | Core goal |
| R3 | Search: find people and/or groups | Core goal |
| R4 | Groups: name, description, one or more admins, membership setting (ADMIN_ONLY \| OPEN); any logged-in user can create a group (becomes its first admin); admins can edit the group's name, description, and membership setting; pre-filled with sensible seed groups (R&D, Engineers, Recruiting, etc.) | Core goal |
| R5 | Membership management: add/remove per setting, admins always remove, anyone self-removes, admins promote/demote other admins (last-admin guard applies) | Core goal |
| R6 | Every membership and settings change produces a history entry: what changed, when, who made it | Core goal |
| R7 | Automatic Membership: admins define filter rules (field / operator / value) combined with AND/OR logic; matching people are auto-added | Core goal |
| R8 | Group view shows a preview indicator of whether Automatic Membership rules are configured | Core goal |

---

## Shape A: Full-Stack Groups Manager

The user-specified solution. One app, one data store, all features as described.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **🟡 Auth — Name Text Box** | |
| A1.1 | 🟡 Login screen: single text input pre-filled with "me" as a UI hint; user clears it and types their actual name | |
| A1.2 | 🟡 Returning path: name matches an existing ACTIVE person → welcome-back message ("Welcome back, [Name]!") → enters app; every person in the system always has title + org set | |
| A1.3 | 🟡 New person path: name not found in system → email auto-generated as `firstname.lastname@company.com` → title/org setup screen (predefined dropdowns) → enters app | |
| A1.4 | 🟡 Suspended people: if a suspended name is entered, login is blocked with a clear message | |
| **A2** | **🟡 Person Model & Profile** | |
| A2.1 | 🟡 Person: id, name, email, title, organization, status (ACTIVE \| SUSPENDED), isSystemAdmin (bool) | |
| A2.2 | Profile view: shows all person fields + list of groups they belong to (group name, their role) | |
| A2.3 | 🟡 Email rule: auto-generated as `firstname.lastname@company.com`; custom email overrides (e.g. Zack Burgess → `zack.burgess@hey.com`) | |
| A2.4 | 🟡 Seed person: Zack Burgess, email `zack.burgess@hey.com`, title "Product Manager and Builder" (unique entry in the predefined title list — his portfolio branding), organization "Research and Development", isSystemAdmin = true | |
| **A3** | **🟡 Profile Management (Settings Menu)** | |
| A3.1 | 🟡 Persistent app header (visible on all post-login pages) contains a home link, search input, and a Settings dropdown; Settings dropdown items: Manage Employees (→ employee management page), Reset Demo (clears and re-seeds), Logout (→ login screen), About (→ about page); Manage Employees shows two sections: active employees (Edit, Suspend) and suspended employees (Rehire); Create Employee button also on this page; all operations apply to any profile except Zack's | |
| A3.2 | 🟡 Create: enter name → uniqueness check → email auto-generated → title/org setup screen → enters app; fires auto-membership Create trigger; writes a ChangeEvent | |
| A3.3 | 🟡 Update: any logged-in user can edit any person's name, title, or organization; name and email must remain unique; email auto-regenerates when name changes (except custom email overrides); fires auto-membership Update trigger (if enabled per group); writes a ChangeEvent | |
| A3.4 | 🟡 Suspend: marks person as SUSPENDED; removes them from all group memberships (writes a ChangeEvent per removal); excluded from login, search, and auto-membership evaluation | |
| A3.5 | 🟡 Rehire: re-activates a SUSPENDED person (status → ACTIVE) using existing profile data — no title/org re-entry needed; treated as a Create operation (fires auto-membership Create trigger); prior group memberships are not restored; writes a ChangeEvent | |
| A3.6 | 🟡 System admin guard: Zack Burgess (isSystemAdmin = true) cannot be updated or suspended by anyone; Suspend/Update actions are hidden/disabled for protected accounts | |
| **A4** | **Search** | |
| A4.1 | Unified search bar — returns matching people and matching groups in one result set | |
| A4.2 | People matched on name, email, title, organization; groups matched on name, description | |
| **A5** | **Group Model & Detail View** | |
| A5.1 | Group: id, name, description, membershipSetting (ADMIN_ONLY \| OPEN) | |
| A5.2 | GroupMembership: groupId, personId, role (MEMBER \| ADMIN), addedAt, addedBy | |
| A5.3 | 🟡 Group detail view: name, description, membership setting, total member count, member list (active members with role), Automatic Membership panel (A8.4), membership history feed | |
| A5.4 | Create Group: accessible from Profile page (below group list); any logged-in user may create; fields: name, description, who can add members (Admins only / Anyone); creator becomes the group's first ADMIN; writes a GROUP_CREATED ChangeEvent; navigates to new group's detail page | |
| A5.5 | Edit Group: same Create/Edit Group modal (pre-filled), accessible via Edit Group button on group detail (admin only); fields: name, description, who can add members; writes a GROUP_UPDATED ChangeEvent on save | |
| **A6** | **Membership Engine** | |
| A6.1 | Add-person gate: if ADMIN_ONLY, only group admins may add others; if OPEN, any group member may add others | |
| A6.2 | Remove-person: group admins can remove anyone; any person can remove themselves regardless of setting | |
| A6.3 | Promote: group admin promotes a MEMBER to ADMIN; Demote: admin demotes another ADMIN to MEMBER (cannot self-demote if last admin in group) | |
| **A7** | **Change History** | |
| A7.1 | 🟡 ChangeEvent model: groupId (nullable for profile-level events), actorType (PERSON \| AUTOMATIC_MEMBERSHIP), actorId (personId if PERSON, null if AUTOMATIC_MEMBERSHIP), eventType, payload (who was affected / what setting changed), timestamp; history displays "Automatic Membership" as the who for system-initiated additions | |
| A7.2 | All A6 operations + group setting changes + auto-membership additions + profile creates write a ChangeEvent | |
| A7.3 | Group detail view: scrollable change history feed (newest first) | |
| **A8** | **🟡 Automatic Membership** | |
| A8.1 | 🟡 Rule model: groupId, combinator (AND \| OR), triggerOnUpdate (bool, default false), list of conditions: { field ∈ {title, organization, email}, operator ∈ {is, is_not, is_one_of, is_not_one_of, contains, does_not_contain}, value: string (single) or string[] (multi for is_one_of / is_not_one_of) }; triggerOnCreate/Rehire is always enabled | |
| A8.2 | 🟡 Rule editor UI: admins add/edit/delete conditions, choose AND/OR combinator; live Preview section splits into "Missing Members" (match rules but not yet in group) and "Current Members" (match rules and already in group); each row shows name + values of the filter fields referenced in conditions; [Add Now] button sits next to the Missing Members header — clicking it stages those people to be added (S11 draft) and re-labels the section to "Adding (N) ✕"; ✕ clears the staged adds and reverts to "Missing Members" without closing the modal; nothing commits until Save; Triggers section has two evaluation checkboxes: "On Create / Rehire" (always on, disabled) and "On Update" (opt-in toggle) | |
| A8.3 | 🟡 Rule evaluation engine: triggers on (1) Bulk Add action — evaluates all ACTIVE people immediately, admin-initiated; (2) Create or Rehire — always evaluates; (3) Update — only if triggerOnUpdate = true for that group; adds matching non-members and logs each as a ChangeEvent | |
| A8.4 | 🟡 Group view Automatic Membership panel: shows full rule summary inline — each condition (field, operator, value), combinator, and which triggers are enabled (Create/Rehire always; Update if toggled on); displayed whether rules are active or not configured | |
| **A9** | **🟡 Seed Data** | |
| A9.1 | 🟡 13 seed people — one per predefined title, distributed across all 8 predefined orgs (every title and org has at least one representative); Engineering, Product, and Design are departments within Research and Development; Zack Burgess is system admin with custom email; see full roster below | |
| A9.2 | 🟡 Each person belongs to at least one group; guaranteed by the All Employees group (every seed person is a member) | |
| A9.3 | 🟡 Seed groups: All Employees, Engineers, R&D, Product, Design, Recruiting — each with at least one admin and pre-seeded members; Engineers, R&D, and Design have Automatic Membership rules pre-configured with existing history entries showing past AM additions | |
| **A10** | **🟡 Client-Side Storage & Reset** | |
| A10.1 | 🟡 All data stored client-side (localStorage or IndexedDB); on app load, `initializeStorage()` checks if localStorage is empty and seeds from S8 if so — no-op on return visits; no shared server state | |
| A10.2 | 🟡 Reset Demo control in the header Settings dropdown clears the local store and re-initializes from seed; returns to login screen; acts as a demo safety net | |
| **A11** | **About Page** | |
| A11.1 | A dedicated About page (accessible from the header Settings dropdown) presenting the app's purpose, Zack's portfolio context, and relevant links (GitHub, etc.) | |

---

## Open Questions (Design Decisions Needed)

| # | Question | Status | Impact |
|---|----------|--------|--------|
| ~~Q1~~ | ~~Auto-membership re-evaluation trigger~~ | ✅ Resolved — fires on: (1) Bulk Add (explicit admin action with live preview), (2) Create or Rehire (always), (3) Update (per-group opt-in toggle); rule save alone does not trigger evaluation | — |
| ~~Q2~~ | ~~Auto-membership and manual removals~~ | ✅ Resolved — no exemption; if a manually removed person's profile later changes to match the rules and triggerOnUpdate is on, they are re-added; rules always win on Update | — |
| ~~Q3~~ | ~~Auto-membership removal~~ | ✅ Resolved — rules are add-only; the only automatic removal from groups is Suspend (A3.4) | — |
| ~~Q4~~ | ~~Rule nesting~~ | ✅ Resolved — flat AND/OR (one combinator shared across all conditions); no condition groups or nesting | — |
| ~~Q5~~ | ~~Preview depth~~ | ✅ Resolved — Level 3: group view shows full rule summary inline (conditions + combinator + trigger settings) | — |
| Q6 | **Tech stack:** Framework and hosting? | Partially resolved — data layer is client-side (localStorage / IndexedDB); framework TBD | Affects A1–A9 implementation |
| ~~Q7~~ | ~~Auth simplicity~~ | ✅ Resolved — text box, "me" pre-filled, no passwords, welcome-back message for returning employees | — |
| ~~Q8~~ | ~~Profile management scope~~ | ✅ Resolved — any logged-in user can Create/Update/Suspend any profile except Zack's | — |
| ~~Q9~~ | ~~Update own vs. others~~ | ✅ Resolved — any profile can be targeted | — |
| ~~Q10~~ | ~~Suspend and group membership~~ | ✅ Resolved — suspended members stay in group rosters in a separate "Suspended" section | — |
| ~~Q11~~ | ~~Title and Organization inputs~~ | ✅ Resolved — both are predefined lists; see lookup tables below | — |

---

## 🟡 Predefined Lookup Tables

Both Title and Organization are selected from fixed lists at first-time setup and in the Settings menu.

### Organizations

| Organization |
|---|
| Research and Development |
| Marketing |
| Sales |
| Human Resources |
| Legal |
| Recruiting |
| Security |
| Data & Analytics |

### Titles

| Title | Notes |
|-------|-------|
| Software Engineer | |
| Senior Software Engineer | |
| Engineering Manager | |
| Product Manager | |
| Product Manager and Builder | Zack's unique portfolio branding entry |
| Designer | |
| UX Researcher | |
| Recruiter | |
| Data Analyst | |
| Marketing Manager | |
| Account Executive | |
| HR Manager | |
| Legal Counsel | |

---

## 🟡 Seed Roster (13 People)

One person per predefined title. Every predefined org has at least one representative.

| Name | Title | Organization | Notes |
|------|-------|--------------|-------|
| Zack Burgess | Product Manager and Builder | Research and Development | System admin, custom email `zack.burgess@hey.com` |
| Alice Chen | Software Engineer | Research and Development | |
| Marcus Webb | Senior Software Engineer | Security | |
| Jordan Park | Engineering Manager | Research and Development | |
| Sofia Rodriguez | Product Manager | Research and Development | |
| Emily Torres | Designer | Research and Development | |
| Aisha Patel | UX Researcher | Research and Development | |
| Ryan O'Brien | Recruiter | Recruiting | |
| Chris Lee | Data Analyst | Data & Analytics | |
| James Wilson | Marketing Manager | Marketing | |
| Ethan Davis | Account Executive | Sales | |
| Hannah Thompson | HR Manager | Human Resources | |
| Noah Garcia | Legal Counsel | Legal | |

All auto-generated emails follow `firstname.lastname@acme.com`.

---

## 🟡 Seed Groups

| Group | Setting | Admin(s) | Seed Members | AM Rules | AM Triggers |
|-------|---------|----------|--------------|----------|-------------|
| All Employees | ADMIN_ONLY | Zack Burgess | All 13 people | `email contains "@"` | Create |
| Engineers | OPEN | Jordan Park | Alice, Marcus, Jordan | `title is-one-of [Software Engineer, Senior Software Engineer, Engineering Manager]` | Create, Update |
| R&D | ADMIN_ONLY | Zack Burgess | Zack, Alice, Jordan, Sofia, Emily, Aisha | `organization is "Research and Development"` | Create |
| Product | OPEN | Sofia Rodriguez | Sofia, Zack | `title is-one-of [Product Manager, Product Manager and Builder]` | Create |
| Design | OPEN | Emily Torres | Emily, Aisha | `title is-one-of [Designer, UX Researcher]` | Create, Update |
| Recruiting | OPEN | Ryan O'Brien | Ryan | None | — |

**AM showcase notes:**
- All Employees uses `email contains "@"` — a universal rule; every person created automatically joins; demonstrates the `contains` operator and Create trigger in the simplest possible form
- Engineers, R&D, and Design seed history includes existing ChangeEvents with `actorType: AUTOMATIC_MEMBERSHIP` — visitors immediately see AM in action in the history feed
- Engineers and Design have `triggerOnUpdate: true` — updating a person's title auto-adds them to the relevant group

---

## Fit Check: R × A

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | 🟡 Login: text box pre-filled "me"; returning name → welcome-back message; new name → auto-email + first-time title/org setup | Core goal | ✅ |
| R1 | Person profile: name, email, title, org, status, groups; ~12 seed people; Zack as protected system admin | Core goal | ✅ |
| R2 | 🟡 Header Settings dropdown: Manage Employees (Create / Edit / Suspend / Rehire any profile except Zack's); Reset Demo; Logout; About; name + email unique; per-browser seed | Core goal | ✅ |
| R3 | Search: find people and/or groups | Core goal | ✅ |
| R4 | Groups: name, description, admins, membership setting; any logged-in user can create a group (becomes first admin); admins can edit group info; seed groups pre-filled | Core goal | ✅ |
| R5 | Membership management: add/remove per setting, self-remove, admin promote/demote, last-admin guard | Core goal | ✅ |
| R6 | Every change produces a history entry: what, when, who | Core goal | ✅ |
| R7 | Automatic Membership: filter rules (field/op/value) with AND/OR; matching people auto-added | Core goal | ✅ |
| R8 | Group view shows indicator of whether Automatic Membership is configured | Core goal | ✅ |

**Notes:**
- R2 ✅: A3 spike resolved — authorization model, suspend behavior, re-activation, uniqueness all answered.
- R7 ✅: Q1 (triggers) and Q2 (manual-removal policy) both resolved; A8.3 flag cleared.

---

## Key Architectural Observations

### The interesting parts

**A8 (Automatic Membership)** is the most novel piece. It's a mini rule-engine inside an otherwise CRUD app. The data model (A8.1) needs to encode conditions as structured data — not freetext — so the evaluator can compare against person fields. This is where most design risk lives.

**A3 (Profile Management / Settings)** has an unresolved authorization surface (Q8, Q9). "Settings" that can Create/Update/Suspend is a powerful operation. If any logged-in user can suspend any other user (except Zack), that's a significant trust decision worth making explicit.

**A7 (Change History)** has a broad capture surface — every A6 action, every group setting change, every A8 auto-add, and every A3 profile operation must write a ChangeEvent. Easy to miss during implementation.

**A6.3 (Last-admin guard)** — Demoting the last admin leaves a group unmanageable. The engine must block this case.

### The straightforward parts

A1 (Text-box login), A2 (Person model), A4 (Search), A5 (Group model), A9 (Seed data) are well-understood. Complexity is low.

### Zack as portfolio centrepiece

Zack's title "Product Manager and Builder" exists in the predefined title list as a one-of-a-kind entry. It signals to anyone viewing the portfolio that this project was built by and for him. His custom email (`zack.burgess@hey.com`) and system-admin protection reinforce this — he's not just seed data, he's the face of the app.

### The flat AND/OR decision (Q4)

Flat AND/OR (all conditions share one combinator) is vastly simpler to model and render:

- **Flat (recommended for V1):** `title is "Engineer" AND organization is "Acme"`
- **Nested:** `(title is "Engineer" OR title is "Senior Engineer") AND organization is "Acme"`

Nested requires a recursive data model and a tree editor UI. Flat is sufficient for most real-world auto-membership use cases and can be layered in later.

### Email generation note

`firstname.lastname@company.com` — "company" needs a defined domain for seed data (e.g. `acme.com`). Zack's email (`zack.burgess@hey.com`) is the only exception in seed and must be stored as a manual override, not derived.
