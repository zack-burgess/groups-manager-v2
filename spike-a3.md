---
shaping: true
---

# A3 Spike: Profile Management (Settings Menu)

## Context

A3 is flagged ⚠️ in the fit check. The mechanism — a Settings menu offering Create, Update, and Suspend — is sketched but the authorization model is unresolved. Q8 and Q9 remain open:

- **Q8**: Can any logged-in user Create/Update/Suspend any profile, or is it scoped (own only, or system-admin only)?
- **Q9**: When updating, does it always apply to the logged-in user's own profile, or can you target another person?

Without answers, A3.1–A3.4 cannot be implemented correctly.

## Goal

Nail down the authorization model for each of the three operations so A3 has no flags.

## Questions & Answers

| # | Question | Answer |
|---|----------|--------|
| A3-Q1 | Who can **Create** a new person? | ✅ Any logged-in user; uses the same sign-in/sign-up flow |
| A3-Q2 | Who can **Update** a profile? | ✅ Any logged-in user can update any profile except Zack's |
| A3-Q3 | Who can **Suspend**? | ✅ Any logged-in user can suspend any profile except Zack's |
| A3-Q4 | Does **Update** always target own profile, or can you target others? | ✅ Any profile can be targeted |
| A3-Q5 | Can suspended people be **re-activated**? | ✅ Yes — via a **Rehire** action in the Settings suspended employees section; Rehire is treated as a Create operation (fires auto-membership Create trigger); existing profile data is preserved, no re-entry of title/org needed |
| A3-Q6 | What happens to **group memberships** on suspend? | ✅ Person is removed from all group memberships entirely; a ChangeEvent is written per removal; prior memberships are not restored on unsuspend |
| A3-Q7 | Does **name change regenerate email**? | ✅ Yes — email auto-regenerates when name changes, except for custom email overrides (e.g. Zack) |

## Additional Decisions Captured

| Decision | Detail |
|----------|--------|
| **Name + email uniqueness** | Both name and email must be unique in the system |
| **Reset database** | A UI control exists to reset the entire database back to seed state |
| **Per-browser fresh seed** | Each web browser starts with a fresh copy of the seed data — implies client-side storage (localStorage / IndexedDB); no shared server state needed |

## Acceptance

✅ Spike complete. All 7 questions answered. A3 flag can be resolved. Findings feed directly into updated A3 and a new A10 (Reset) in the shaping doc.
