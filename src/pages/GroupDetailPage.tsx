import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getSession } from '../services/storage'
import { loadGroup, loadGroupMembers, loadGroupHistory, loadGroupRules } from '../services/groups'
import { loadPerson } from '../services/people'
import type { Group, MemberRole, ChangeEvent, AutoMembershipRule, Person } from '../types'

type Tab = 'members' | 'history'

interface Member {
  person: Person
  role: MemberRole
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [history, setHistory] = useState<ChangeEvent[]>([])
  const [rules, setRules] = useState<AutoMembershipRule | null>(null)
  const [tab, setTab] = useState<Tab>('members')
  const [currentPersonId, setCurrentPersonId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    if (!groupId) {
      navigate('/', { replace: true })
      return
    }
    const found = loadGroup(groupId)
    if (!found) {
      navigate('/', { replace: true })
      return
    }
    setGroup(found)
    setMembers(loadGroupMembers(groupId))
    setHistory(loadGroupHistory(groupId))
    setRules(loadGroupRules(groupId))
    setCurrentPersonId(session.personId)
  }, [groupId, navigate])

  if (!group) return null

  const currentMembership = members.find(m => m.person.id === currentPersonId)
  const isAdmin = currentMembership?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Group header */}
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
            <MembershipSettingBadge setting={group.membershipSetting} />
          </div>
          <p className="text-sm text-gray-500 mb-6">{group.description}</p>

          {/* AM panel */}
          <div className="mb-6 p-4 rounded-lg border border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto-membership</span>
              {isAdmin && (
                <button
                  disabled
                  className="text-xs text-gray-400 cursor-default"
                >
                  Edit Rules (V7)
                </button>
              )}
            </div>
            {rules ? (
              <RuleSummary rules={rules} />
            ) : (
              <p className="text-sm text-gray-400">Not configured</p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setTab('members')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'members'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setTab('history')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div>

          {/* Members tab */}
          {tab === 'members' && (
            <ul className="space-y-2">
              {members.map(({ person, role }) => (
                <li
                  key={person.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-sm"
                >
                  <button
                    onClick={() => navigate(`/profile/${person.id}`)}
                    className="text-gray-700 font-medium hover:text-blue-600 transition-colors text-left"
                  >
                    {person.name}
                  </button>
                  <RoleBadge role={role} />
                </li>
              ))}
            </ul>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <ul className="space-y-2">
              {history.length === 0 && (
                <p className="text-sm text-gray-400">No history yet.</p>
              )}
              {history.map(event => (
                <li
                  key={event.id}
                  className="px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-700"
                >
                  <HistoryRow event={event} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

function MembershipSettingBadge({ setting }: { setting: Group['membershipSetting'] }) {
  if (setting === 'OPEN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        Open
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Admins only
    </span>
  )
}

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Member
    </span>
  )
}

function RuleSummary({ rules }: { rules: AutoMembershipRule }) {
  const conditionText = rules.conditions.map(c => {
    const val = Array.isArray(c.value) ? c.value.join(', ') : c.value
    const opLabel: Record<string, string> = {
      is: 'is',
      is_not: 'is not',
      is_one_of: 'is one of',
      is_not_one_of: 'is not one of',
      contains: 'contains',
      does_not_contain: 'does not contain',
    }
    return `${c.field} ${opLabel[c.operator] ?? c.operator} "${val}"`
  })

  return (
    <div className="text-sm text-gray-700 space-y-1">
      {conditionText.map((text, i) => (
        <div key={i}>
          {i > 0 && (
            <span className="text-xs font-medium text-gray-400 uppercase mr-1">{rules.combinator}</span>
          )}
          {text}
        </div>
      ))}
      <div className="text-xs text-gray-400 mt-1">
        Triggers: on create/rehire{rules.triggerOnUpdate ? ', on update' : ''}
      </div>
    </div>
  )
}

function HistoryRow({ event }: { event: ChangeEvent }) {
  const actorLabel = event.actorType === 'AUTOMATIC_MEMBERSHIP'
    ? 'auto-membership'
    : event.actorId
      ? (loadPerson(event.actorId)?.name ?? event.actorId)
      : 'system'

  const date = new Date(event.timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const payload = event.payload as Record<string, string>

  const descriptions: Record<string, string> = {
    MEMBER_ADDED: `${payload.personName ?? 'Someone'} added by ${actorLabel}`,
    MEMBER_REMOVED: `${payload.personName ?? 'Someone'} removed by ${actorLabel}`,
    ROLE_CHANGED: `${payload.personName ?? 'Someone'} role changed by ${actorLabel}`,
    SETTING_CHANGED: `Membership setting changed by ${actorLabel}`,
    EMPLOYEE_CREATED: `Employee created by ${actorLabel}`,
    EMPLOYEE_UPDATED: `Employee updated by ${actorLabel}`,
  }

  const description = descriptions[event.eventType] ?? event.eventType

  return (
    <span>
      {description} — <span className="text-gray-400">{date}</span>
    </span>
  )
}
