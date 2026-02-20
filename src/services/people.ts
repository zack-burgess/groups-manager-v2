import type { Person } from '../types'
import { getPeople, savePeople, getChangeEvents, saveChangeEvents, saveSession } from './storage'

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
  return `${first}.${last}@acme.com`
}

// N10: Load a single person by ID
export function loadPerson(id: string): Person | null {
  return getPeople().find(p => p.id === id) ?? null
}

// N8: Create a new employee, write to S1, return the new Person
export function createEmployee(name: string, email: string, title: string, org: string): Person {
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
  saveSession({ personId: id })
  writeEmployeeCreatedEvent(id, name.trim())
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
