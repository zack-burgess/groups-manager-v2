import type { Condition, Person, AutoMembershipRule } from '../types'
import { getPeople, getMemberships, saveMemberships, getAutoMembershipRules, saveAutoMembershipRules } from './storage'
import { writeChangeEvent } from './groups'

export interface EvalResult {
  missing: Person[]  // match rules, not members, not staged
  staged: Person[]   // match rules, not members, staged for add
  current: Person[]  // match rules, already members
}

// N26: Evaluate rules against S1, S3, and staged set (S11 equivalent in React state)
export function evaluateRules(
  conditions: Condition[],
  combinator: 'AND' | 'OR',
  groupId: string,
  stagedPersonIds: Set<string>,
): EvalResult {
  if (conditions.length === 0) return { missing: [], staged: [], current: [] }

  const allPeople = getPeople().filter(p => p.status === 'ACTIVE')
  const memberIds = new Set(getMemberships().filter(m => m.groupId === groupId).map(m => m.personId))
  const matching = allPeople.filter(p => matchesConditions(p, conditions, combinator))

  const missing: Person[] = []
  const staged: Person[] = []
  const current: Person[] = []

  for (const person of matching) {
    if (memberIds.has(person.id)) current.push(person)
    else if (stagedPersonIds.has(person.id)) staged.push(person)
    else missing.push(person)
  }

  return { missing, staged, current }
}

function matchesConditions(person: Person, conditions: Condition[], combinator: 'AND' | 'OR'): boolean {
  if (combinator === 'AND') return conditions.every(c => matchesCondition(person, c))
  return conditions.some(c => matchesCondition(person, c))
}

function getFieldValue(person: Person, field: 'title' | 'organization' | 'email'): string {
  return person[field]
}

function matchesCondition(person: Person, condition: Condition): boolean {
  const fieldValue = getFieldValue(person, condition.field).toLowerCase()

  switch (condition.operator) {
    case 'is':
      return fieldValue === (condition.value as string).toLowerCase()
    case 'is_not':
      return fieldValue !== (condition.value as string).toLowerCase()
    case 'is_one_of':
      return (condition.value as string[]).some(v => v.toLowerCase() === fieldValue)
    case 'is_not_one_of':
      return !(condition.value as string[]).some(v => v.toLowerCase() === fieldValue)
    case 'contains':
      return fieldValue.includes((condition.value as string).toLowerCase())
    case 'does_not_contain':
      return !fieldValue.includes((condition.value as string).toLowerCase())
    default:
      return false
  }
}

// N30: Upsert rules in S5, promote staged adds (S11→S3), write change events (N29)
export function saveRules(
  groupId: string,
  conditions: Condition[],
  combinator: 'AND' | 'OR',
  triggerOnUpdate: boolean,
  stagedPersonIds: string[],
): void {
  // 1. Upsert in S5
  const allRules = getAutoMembershipRules()
  const newRule: AutoMembershipRule = { groupId, conditions, combinator, triggerOnUpdate }
  const existingIdx = allRules.findIndex(r => r.groupId === groupId)
  if (existingIdx >= 0) {
    saveAutoMembershipRules(allRules.map((r, i) => i === existingIdx ? newRule : r))
  } else {
    saveAutoMembershipRules([...allRules, newRule])
  }

  // 2. Promote staged adds from S11 → S3
  if (stagedPersonIds.length === 0) return
  const memberships = getMemberships()
  const people = getPeople()
  const newMemberships = stagedPersonIds
    .filter(id => !memberships.some(m => m.groupId === groupId && m.personId === id))
    .map(personId => ({
      groupId,
      personId,
      role: 'MEMBER' as const,
      addedAt: new Date().toISOString(),
      addedBy: 'AUTOMATIC_MEMBERSHIP',
    }))
  if (newMemberships.length > 0) saveMemberships([...memberships, ...newMemberships])

  // 3. N29: Write MEMBER_ADDED events with actorType AUTOMATIC_MEMBERSHIP
  for (const m of newMemberships) {
    const person = people.find(p => p.id === m.personId)
    writeChangeEvent({
      groupId,
      actorType: 'AUTOMATIC_MEMBERSHIP',
      actorId: null,
      eventType: 'MEMBER_ADDED',
      payload: { personId: m.personId, personName: person?.name ?? m.personId },
    })
  }
}
