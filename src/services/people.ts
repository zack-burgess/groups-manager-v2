import type { Person, PersonStatus } from '../types'
import { getPeople, savePeople, getMemberships, saveMemberships, getChangeEvents, saveChangeEvents, saveSession, clearSession } from './storage'
import { writeChangeEvent } from './groups'
import { evaluateAutoMembershipOnCreate, evaluateAutoMembershipOnUpdate } from './rules'

// N1: Case-insensitive name lookup
export function lookupPerson(name: string): Person | null {
  const normalized = name.trim().toLowerCase()
  return getPeople().find(p => p.name.toLowerCase() === normalized) ?? null
}

// N3: Generates firstname.lastname@acme.com
// Handles apostrophes (O'Brien → obrien), spaces, hyphens
export function generateEmail(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0].replace(/[^a-zA-Z]/g, '').toLowerCase()
  const last = parts.slice(1).join('').replace(/[^a-zA-Z]/g, '').toLowerCase()
  return last ? `${first}.${last}@acme.com` : `${first}@acme.com`
}

// N10: Load a single person by ID
export function loadPerson(id: string): Person | null {
  return getPeople().find(p => p.id === id) ?? null
}

// N8: Create a new employee, write to S1, optionally save session, return the new Person
export function createEmployee(name: string, email: string, title: string, org: string, setSession = true): Person {
  const people = getPeople()
  const id = `p${Date.now()}`
  const newPerson: Person = {
    id,
    name: name.trim(),
    email,
    title,
    organization: org,
    status: 'ACTIVE',
    isSystemAdmin: false,
  }
  savePeople([...people, newPerson])
  if (setSession) saveSession({ personId: id })
  writeEmployeeCreatedEvent(id, name.trim())
  evaluateAutoMembershipOnCreate(id)
  return newPerson
}

// N9: Write EMPLOYEE_CREATED ChangeEvent
export function writeEmployeeCreatedEvent(personId: string, personName: string): void {
  const events = getChangeEvents()
  const newEvent = {
    id: `ce${Date.now()}`,
    groupId: null,
    actorType: 'PERSON' as const,
    actorId: personId,
    eventType: 'EMPLOYEE_CREATED',
    payload: { personId, personName },
    timestamp: new Date().toISOString(),
  }
  saveChangeEvents([...events, newEvent])
}

// N32: Load all employees split into active and suspended, each sorted by name
export function loadAllEmployees(): { active: Person[]; suspended: Person[] } {
  const all = getPeople().sort((a, b) => a.name.localeCompare(b.name))
  return {
    active: all.filter(p => p.status === 'ACTIVE'),
    suspended: all.filter(p => p.status === 'SUSPENDED'),
  }
}

// N33: Returns true if the person is a system admin (Update/Suspend actions hidden for them)
export function checkSystemAdminGuard(personId: string): boolean {
  return getPeople().find(p => p.id === personId)?.isSystemAdmin ?? false
}

// N36: Remove person from all groups, write MEMBER_REMOVED event per group (internal)
function removeFromAllGroups(personId: string): void {
  const all = getMemberships()
  const personMemberships = all.filter(m => m.personId === personId)
  saveMemberships(all.filter(m => m.personId !== personId))
  const person = getPeople().find(p => p.id === personId)
  for (const m of personMemberships) {
    writeChangeEvent({
      groupId: m.groupId,
      actorType: 'PERSON',
      actorId: null,
      eventType: 'MEMBER_REMOVED',
      payload: { personId, personName: person?.name ?? personId },
    })
  }
}

// N35: Suspend an employee; cascade-removes from all groups
export function suspendEmployee(id: string): void {
  const person = getPeople().find(p => p.id === id)
  savePeople(getPeople().map(p => p.id === id ? { ...p, status: 'SUSPENDED' as PersonStatus } : p))
  removeFromAllGroups(id)
  writeChangeEvent({
    groupId: null,
    actorType: 'PERSON',
    actorId: null,
    eventType: 'EMPLOYEE_SUSPENDED',
    payload: { personId: id, personName: person?.name ?? id },
  })
}

// N37: Rehire a suspended employee; N38 (AM evaluation) is a stub activated in V8
export function rehireEmployee(id: string): void {
  const person = getPeople().find(p => p.id === id)
  savePeople(getPeople().map(p => p.id === id ? { ...p, status: 'ACTIVE' as PersonStatus } : p))
  writeChangeEvent({
    groupId: null,
    actorType: 'PERSON',
    actorId: null,
    eventType: 'EMPLOYEE_REHIRED',
    payload: { personId: id, personName: person?.name ?? id },
  })
  evaluateAutoMembershipOnCreate(id)
}

// N40: Load employee for update
export function loadEmployeeForUpdate(id: string): Person | null {
  return loadPerson(id)
}

// N41 + N42: Update employee, regenerate email, write EMPLOYEE_UPDATED event
// N43: evaluateAutoMembershipOnUpdate — stub, activated in V8
export function updateEmployee(id: string, name: string, title: string, org: string): Person | null {
  const people = getPeople()
  const existing = people.find(p => p.id === id)
  if (!existing) return null
  const email = generateEmail(name.trim())
  const updated: Person = { ...existing, name: name.trim(), email, title, organization: org }
  savePeople(people.map(p => p.id === id ? updated : p))
  writeChangeEvent({
    groupId: null,
    actorType: 'PERSON',
    actorId: id,
    eventType: 'EMPLOYEE_UPDATED',
    payload: { personId: id, personName: name.trim() },
  })
  evaluateAutoMembershipOnUpdate(id)
  return updated
}

// N44: Logout — clear session
export function logout(): void {
  clearSession()
}
