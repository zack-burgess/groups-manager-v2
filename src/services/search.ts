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
