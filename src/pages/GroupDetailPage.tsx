import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getSession } from '../services/storage'
import {
  loadGroup, loadGroupMembers, loadGroupHistory, loadGroupRules,
  removeMember, changeMemberRole,
  checkAddMemberPermission, searchNonMembers, addMember,
} from '../services/groups'
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
  const [canAdd, setCanAdd] = useState(false)

  // Inline add panel state
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [addQuery, setAddQuery] = useState('')
  const [addResults, setAddResults] = useState<Person[]>([])
  const addInputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(() => {
    if (!groupId) return
    const freshGroup = loadGroup(groupId)
    if (!freshGroup) return
    setGroup(freshGroup)
    const freshMembers = loadGroupMembers(groupId)
    setMembers(prev => {
      const freshById = Object.fromEntries(freshMembers.map(m => [m.person.id, m]))
      const updated = prev.map(m => freshById[m.person.id]).filter(Boolean) as Member[]
      const existingIds = new Set(prev.map(m => m.person.id))
      const added = freshMembers.filter(m => !existingIds.has(m.person.id))
      return [...updated, ...added]
    })
    setHistory(loadGroupHistory(groupId))
  }, [groupId])

  useEffect(() => {
    const session = getSession()
    if (!session) { navigate('/', { replace: true }); return }
    if (!groupId) { navigate('/', { replace: true }); return }
    const found = loadGroup(groupId)
    if (!found) { navigate('/', { replace: true }); return }
    setGroup(found)
    const initialMembers = loadGroupMembers(groupId)
    const sorted = [...initialMembers].sort((a, b) => {
      if (a.role !== b.role) return a.role === 'ADMIN' ? -1 : 1
      if (a.person.id === session.personId) return -1
      if (b.person.id === session.personId) return 1
      return 0
    })
    setMembers(sorted)
    setHistory(loadGroupHistory(groupId))
    setRules(loadGroupRules(groupId))
    setCurrentPersonId(session.personId)
    setCanAdd(checkAddMemberPermission(groupId, session.personId))
  }, [groupId, navigate])

  // Re-check canAdd whenever group or members change (setting may have changed)
  useEffect(() => {
    if (!groupId || !currentPersonId) return
    setCanAdd(checkAddMemberPermission(groupId, currentPersonId))
  }, [group, members, groupId, currentPersonId])

  if (!group || !currentPersonId) return null

  const currentMembership = members.find(m => m.person.id === currentPersonId)
  const isAdmin = currentMembership?.role === 'ADMIN'
  const adminCount = members.filter(m => m.role === 'ADMIN').length

  function handleRemove(personId: string) {
    if (!groupId || !currentPersonId) return
    removeMember(groupId, personId, currentPersonId)
    refresh()
    if (personId === currentPersonId) navigate(-1)
  }

  function handleRoleChange(personId: string, currentRole: MemberRole) {
    if (!groupId || !currentPersonId) return
    const newRole: MemberRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN'
    changeMemberRole(groupId, personId, newRole, currentPersonId)
    refresh()
  }

  function handleAddQueryChange(q: string) {
    setAddQuery(q)
    if (!groupId) return
    setAddResults(searchNonMembers(groupId, q))
  }

  function handleAddMember(personId: string) {
    if (!groupId || !currentPersonId) return
    addMember(groupId, personId, currentPersonId)
    setAddPanelOpen(false)
    setAddQuery('')
    setAddResults([])
    refresh()
  }

  function handleOpenAddPanel() {
    setAddPanelOpen(true)
    setTimeout(() => addInputRef.current?.focus(), 0)
  }

  function handleCloseAddPanel() {
    setAddPanelOpen(false)
    setAddQuery('')
    setAddResults([])
  }

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
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
            {isAdmin && (
              <button
                onClick={() => navigate(`/group/${groupId}/edit`)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit group"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">{group.description}</p>

          {/* AM panel */}
          <div className="mb-6 p-4 rounded-lg border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto-membership</span>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/group/${groupId}/rules`)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit rules"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </button>
              )}
            </div>
            {rules ? <RuleSummary rules={rules} /> : <p className="text-sm text-gray-400">Not configured</p>}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            <button
              onClick={() => setTab('members')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === 'members'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
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

          {/* Members tab note */}
          {tab === 'members' && (
            <p className="text-xs text-gray-400 mb-4">
              {group.membershipSetting === 'OPEN' ? 'Anyone can add members' : 'Admins can add members'} · Anyone can remove themselves
            </p>
          )}

          {/* Members tab */}
          {tab === 'members' && (
            <ul className="space-y-2">
              {members.map(({ person, role }) => {
                const isLastAdmin = role === 'ADMIN' && adminCount === 1
                const canRemoveThis = (isAdmin || person.id === currentPersonId) && !isLastAdmin
                const canPromoteDemote = isAdmin && person.id !== currentPersonId
                return (
                  <li
                    key={person.id}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {/* Name · Title — one line */}
                    <button
                      onClick={() => navigate(`/profile/${person.id}`)}
                      className="flex-1 text-left min-w-0 hover:text-blue-600 transition-colors"
                    >
                      <span className="font-medium text-gray-700">{person.name}</span>
                      <span className="text-gray-400 ml-1">· {person.title}</span>
                    </button>

                    {/* Role badge + arrow */}
                    <div className="flex items-center gap-1 shrink-0">
                      <RoleBadge role={role} />
                      <span className={`relative group inline-flex items-center ${canPromoteDemote ? '' : 'invisible'}`}>
                        <button
                          onClick={() => handleRoleChange(person.id, role)}
                          disabled={!canPromoteDemote || (isLastAdmin && role === 'ADMIN')}
                          className="text-gray-400 hover:text-blue-600 disabled:text-gray-200 disabled:cursor-default transition-colors leading-none"
                        >
                          {role === 'ADMIN' ? '↓' : '↑'}
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-700 rounded whitespace-nowrap hidden group-hover:block pointer-events-none">
                          {role === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
                        </span>
                      </span>
                    </div>

                    {/* Remove */}
                    <span className={`relative group inline-flex items-center ml-2 ${canRemoveThis ? '' : 'invisible'}`}>
                      <button
                        onClick={() => handleRemove(person.id)}
                        disabled={!canRemoveThis}
                        className="text-gray-400 hover:text-red-500 transition-colors text-sm leading-none"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-700 rounded whitespace-nowrap hidden group-hover:block pointer-events-none">
                        Remove
                      </span>
                    </span>
                  </li>
                )
              })}

              {/* Inline add member */}
              {canAdd && !addPanelOpen && (
                <li>
                  <button
                    onClick={handleOpenAddPanel}
                    className="w-full text-left px-4 py-3 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    + Add a member
                  </button>
                </li>
              )}

              {canAdd && addPanelOpen && (
                <li className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                  <input
                    ref={addInputRef}
                    type="text"
                    value={addQuery}
                    onChange={e => handleAddQueryChange(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && handleCloseAddPanel()}
                    placeholder="Search by name, title, or org…"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  {addResults.length > 0 && (
                    <ul className="space-y-1">
                      {addResults.map(person => (
                        <li
                          key={person.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100 text-sm"
                        >
                          <span className="text-gray-700">
                            {person.name}
                            <span className="text-gray-400 ml-1">· {person.title} · {person.organization}</span>
                          </span>
                          <button
                            onClick={() => handleAddMember(person.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors ml-3 shrink-0"
                          >
                            Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {addQuery && addResults.length === 0 && (
                    <p className="text-xs text-gray-400 px-1">No matches.</p>
                  )}
                  <button
                    onClick={handleCloseAddPanel}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </li>
              )}
            </ul>
          )}

          {/* History tab */}
          {tab === 'history' && (() => {
            const membershipHistory = history.filter(e =>
              e.eventType === 'MEMBER_ADDED' || e.eventType === 'MEMBER_REMOVED'
            )
            return (
              <ul className="space-y-2">
                {membershipHistory.length === 0 && (
                  <p className="text-sm text-gray-400">No membership history yet.</p>
                )}
                {membershipHistory.map(event => (
                  <li
                    key={event.id}
                    className="px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-700"
                  >
                    <HistoryRow event={event} />
                  </li>
                ))}
              </ul>
            )
          })()}
        </div>
      </main>
    </div>
  )
}

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
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
  const fieldLabel: Record<string, string> = {
    title: 'Title', organization: 'Organization', email: 'Email',
  }
  const opLabel: Record<string, string> = {
    is: 'is', is_not: 'is not', is_one_of: 'is one of',
    is_not_one_of: 'is not one of', contains: 'contains', does_not_contain: 'does not contain',
  }
  return (
    <div className="text-sm text-gray-700 space-y-1">
      {rules.conditions.map((c, i) => {
        const val = Array.isArray(c.value) ? c.value.join(', ') : c.value
        return (
          <div key={i} className="pl-3">
            {i > 0 && <span className="text-xs font-medium text-gray-400 uppercase mr-1">{rules.combinator}</span>}
            {fieldLabel[c.field] ?? c.field} {opLabel[c.operator] ?? c.operator} "{val}"
          </div>
        )
      })}
      <div className="text-xs text-gray-400 mt-1 pl-3">
        Triggers: On Create/Rehire{rules.triggerOnUpdate ? ', On Update' : ''}
      </div>
    </div>
  )
}

function HistoryRow({ event }: { event: ChangeEvent }) {
  const payload = event.payload as Record<string, string>
  const triggerLabel = payload.trigger === 'UPDATE' ? 'Update' : 'Create/Rehire'
  const actorLabel = event.actorType === 'AUTOMATIC_MEMBERSHIP'
    ? `${triggerLabel} by Auto-Membership`
    : event.actorType === 'GROUP_CREATED'
      ? 'Creating Group'
      : event.actorId
        ? (loadPerson(event.actorId)?.name ?? event.actorId)
        : 'system'

  const date = new Date(event.timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const descriptions: Record<string, string> = {
    MEMBER_ADDED: `${payload.personName ?? 'Someone'} added by ${actorLabel}`,
    MEMBER_REMOVED: event.actorId === null
      ? `${payload.personName ?? 'Someone'} removed on Suspension`
      : `${payload.personName ?? 'Someone'} removed by ${actorLabel}`,
    ROLE_CHANGED: `${payload.personName ?? 'Someone'} role changed to ${payload.newRole?.toLowerCase() ?? '?'} by ${actorLabel}`,
    SETTING_CHANGED: `Membership setting changed to ${payload.newSetting ?? '?'} by ${actorLabel}`,
    EMPLOYEE_CREATED: `Employee created by ${actorLabel}`,
    EMPLOYEE_UPDATED: `Employee updated by ${actorLabel}`,
  }

  return (
    <span>
      {descriptions[event.eventType] ?? event.eventType}
      {' '}— <span className="text-gray-400">{date}</span>
    </span>
  )
}
