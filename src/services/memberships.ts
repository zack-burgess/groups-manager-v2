import type { Group, MemberRole } from '../types'
import { getMemberships, getGroups } from './storage'

// N11: Returns [{group, role}] for a given person, sorted by group name
export function loadPersonMemberships(personId: string): Array<{ group: Group; role: MemberRole }> {
  const memberships = getMemberships().filter(m => m.personId === personId)
  const groups = getGroups()
  return memberships
    .map(m => {
      const group = groups.find(g => g.id === m.groupId)
      if (!group) return null
      return { group, role: m.role }
    })
    .filter((item): item is { group: Group; role: MemberRole } => item !== null)
    .sort((a, b) => a.group.name.localeCompare(b.group.name))
}
