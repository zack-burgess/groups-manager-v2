import type { Person, Group, Membership, ChangeEvent, AutoMembershipRule, Session } from '../types'
import seedData from '../data/seedData'

const KEYS = {
  people: 'gm_people',
  groups: 'gm_groups',
  memberships: 'gm_memberships',
  changeEvents: 'gm_changeEvents',
  autoMembershipRules: 'gm_autoMembershipRules',
  session: 'gm_session',
} as const

function read<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// N50: Seeds localStorage from seedData if empty; no-op on return visits
export function initializeStorage(): void {
  if (localStorage.getItem(KEYS.people) !== null) return
  write(KEYS.people, seedData.people)
  write(KEYS.groups, seedData.groups)
  write(KEYS.memberships, seedData.memberships)
  write(KEYS.changeEvents, seedData.changeEvents)
  write(KEYS.autoMembershipRules, seedData.autoMembershipRules)
}

// S1: people
export function getPeople(): Person[] {
  return read<Person[]>(KEYS.people) ?? []
}
export function savePeople(people: Person[]): void {
  write(KEYS.people, people)
}

// S2: groups
export function getGroups(): Group[] {
  return read<Group[]>(KEYS.groups) ?? []
}
export function saveGroups(groups: Group[]): void {
  write(KEYS.groups, groups)
}

// S3: memberships
export function getMemberships(): Membership[] {
  return read<Membership[]>(KEYS.memberships) ?? []
}
export function saveMemberships(memberships: Membership[]): void {
  write(KEYS.memberships, memberships)
}

// S4: changeEvents
export function getChangeEvents(): ChangeEvent[] {
  return read<ChangeEvent[]>(KEYS.changeEvents) ?? []
}
export function saveChangeEvents(events: ChangeEvent[]): void {
  write(KEYS.changeEvents, events)
}

// S5: autoMembershipRules
export function getAutoMembershipRules(): AutoMembershipRule[] {
  return read<AutoMembershipRule[]>(KEYS.autoMembershipRules) ?? []
}
export function saveAutoMembershipRules(rules: AutoMembershipRule[]): void {
  write(KEYS.autoMembershipRules, rules)
}

// S9: session
export function getSession(): Session | null {
  return read<Session>(KEYS.session)
}
export function saveSession(session: Session): void {
  write(KEYS.session, session)
}
export function clearSession(): void {
  localStorage.removeItem(KEYS.session)
}
