import type { Group, Person, MemberRole, ChangeEvent, AutoMembershipRule } from '../types'
import { getGroups, getMemberships, getPeople, getChangeEvents, getAutoMembershipRules } from './storage'

// N14: Load a single group by ID
export function loadGroup(id: string): Group | null {
  return getGroups().find(g => g.id === id) ?? null
}

// N15: Load members of a group with their person details, sorted by name
export function loadGroupMembers(groupId: string): Array<{ person: Person; role: MemberRole }> {
  const memberships = getMemberships().filter(m => m.groupId === groupId)
  const people = getPeople()
  return memberships
    .map(m => {
      const person = people.find(p => p.id === m.personId)
      if (!person) return null
      return { person, role: m.role }
    })
    .filter((item): item is { person: Person; role: MemberRole } => item !== null)
    .sort((a, b) => a.person.name.localeCompare(b.person.name))
}

// N16: Load change events for a group, newest first
export function loadGroupHistory(groupId: string): ChangeEvent[] {
  return getChangeEvents()
    .filter(e => e.groupId === groupId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// N21: Load auto-membership rules for a group, null if none
export function loadGroupRules(groupId: string): AutoMembershipRule | null {
  return getAutoMembershipRules().find(r => r.groupId === groupId) ?? null
}
