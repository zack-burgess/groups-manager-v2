export type PersonStatus = 'ACTIVE' | 'SUSPENDED'
export type MemberRole = 'MEMBER' | 'ADMIN'
export type MembershipSetting = 'ADMIN_ONLY' | 'OPEN'
export type ActorType = 'PERSON' | 'AUTOMATIC_MEMBERSHIP'

export interface Person {
  id: string
  name: string
  email: string
  title: string
  organization: string
  status: PersonStatus
  isSystemAdmin: boolean
}

export interface Group {
  id: string
  name: string
  description: string
  membershipSetting: MembershipSetting
}

export interface Membership {
  groupId: string
  personId: string
  role: MemberRole
  addedAt: string
  addedBy: string
}

export interface ChangeEvent {
  id: string
  groupId: string | null
  actorType: ActorType
  actorId: string | null
  eventType: string
  payload: Record<string, unknown>
  timestamp: string
}

export interface Condition {
  field: 'title' | 'organization' | 'email'
  operator: 'is' | 'is_not' | 'is_one_of' | 'is_not_one_of' | 'contains' | 'does_not_contain'
  value: string | string[]
}

export interface AutoMembershipRule {
  groupId: string
  conditions: Condition[]
  combinator: 'AND' | 'OR'
  triggerOnUpdate: boolean
}

export interface Session {
  personId: string
}

export interface SeedData {
  people: Person[]
  groups: Group[]
  memberships: Membership[]
  changeEvents: ChangeEvent[]
  autoMembershipRules: AutoMembershipRule[]
}
