import type { Group, Person, MemberRole, MembershipSetting, Membership, ChangeEvent, AutoMembershipRule } from '../types'
import {
  getGroups, saveGroups,
  getMemberships, saveMemberships,
  getPeople,
  getChangeEvents, saveChangeEvents,
  getAutoMembershipRules,
} from './storage'

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

// N20: Write a change event to S4
export function writeChangeEvent(event: Omit<ChangeEvent, 'id' | 'timestamp'>): void {
  const events = getChangeEvents()
  const newEvent: ChangeEvent = {
    ...event,
    id: `ce${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
  saveChangeEvents([...events, newEvent])
}

// N17: Toggle group membership setting, write change event
export function changeGroupSetting(groupId: string, setting: MembershipSetting, actorId: string): void {
  const groups = getGroups()
  saveGroups(groups.map(g => g.id === groupId ? { ...g, membershipSetting: setting } : g))
  writeChangeEvent({
    groupId,
    actorType: 'PERSON',
    actorId,
    eventType: 'SETTING_CHANGED',
    payload: { newSetting: setting },
  })
}

// N18: Remove a member from a group, write change event
export function removeMember(groupId: string, personId: string, actorId: string): void {
  saveMemberships(getMemberships().filter(m => !(m.groupId === groupId && m.personId === personId)))
  const person = getPeople().find(p => p.id === personId)
  writeChangeEvent({
    groupId,
    actorType: 'PERSON',
    actorId,
    eventType: 'MEMBER_REMOVED',
    payload: { personId, personName: person?.name ?? personId },
  })
}

// N19: Change a member's role. Returns false if blocked by last-admin guard.
export function changeMemberRole(groupId: string, personId: string, newRole: MemberRole, actorId: string): boolean {
  const memberships = getMemberships()
  if (newRole === 'MEMBER') {
    const admins = memberships.filter(m => m.groupId === groupId && m.role === 'ADMIN')
    if (admins.length === 1 && admins[0].personId === personId) return false
  }
  saveMemberships(memberships.map(m =>
    m.groupId === groupId && m.personId === personId ? { ...m, role: newRole } : m
  ))
  const person = getPeople().find(p => p.id === personId)
  writeChangeEvent({
    groupId,
    actorType: 'PERSON',
    actorId,
    eventType: 'ROLE_CHANGED',
    payload: { personId, personName: person?.name ?? personId, newRole },
  })
  return true
}

// N22: Check if a person can add members (any member if OPEN, admins only if ADMIN_ONLY)
export function checkAddMemberPermission(groupId: string, actorId: string): boolean {
  const group = getGroups().find(g => g.id === groupId)
  if (!group) return false
  const membership = getMemberships().find(m => m.groupId === groupId && m.personId === actorId)
  if (!membership) return false
  if (group.membershipSetting === 'OPEN') return true
  return membership.role === 'ADMIN'
}

// N23: Search people who are not yet members of the group
export function searchNonMembers(groupId: string, query: string): Person[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const memberIds = new Set(getMemberships().filter(m => m.groupId === groupId).map(m => m.personId))
  return getPeople()
    .filter(p =>
      p.status === 'ACTIVE' &&
      !memberIds.has(p.id) &&
      (
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.organization.toLowerCase().includes(q)
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}

// N24: Add a member to a group (idempotent), write change event
export function addMember(groupId: string, personId: string, addedBy: string): void {
  const memberships = getMemberships()
  if (memberships.some(m => m.groupId === groupId && m.personId === personId)) return
  const newMembership: Membership = {
    groupId,
    personId,
    role: 'MEMBER',
    addedAt: new Date().toISOString(),
    addedBy,
  }
  saveMemberships([...memberships, newMembership])
  const person = getPeople().find(p => p.id === personId)
  writeChangeEvent({
    groupId,
    actorType: 'PERSON',
    actorId: addedBy,
    eventType: 'MEMBER_ADDED',
    payload: { personId, personName: person?.name ?? personId },
  })
}
