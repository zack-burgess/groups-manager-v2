import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getSession } from '../services/storage'
import {
  loadGroup, loadGroupMembers, loadGroupHistory, loadGroupRules,
  changeGroupSetting, removeMember, changeMemberRole,
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
    setMembers(loadGroupMembers(groupId))
    setHistory(loadGroupHistory(groupId))
  }, [groupId])

  useEffect(() => {
    const session = getSession()
    if (!session) { navigate('/', { replace: true }); return }
    if (!groupId) { navigate('/', { replace: true }); return }
    const found = loadGroup(groupId)
    if (!found) { navigate('/', { replace: true }); return }
    setGroup(found)
    setMembers(loadGroupMembers(groupId))
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

  function handleChangeSetting() {
    if (!groupId || !currentPersonId) return
    const newSetting = group!.membershipSetting === 'OPEN' ? 'ADMIN_ONLY' : 'OPEN'
    changeGroupSetting(groupId, newSetting, currentPersonId)
    refresh()
  }

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
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
            <div className="flex items-center gap-2">
              <MembershipSettingBadge setting={group.membershipSetting} />
              {isAdmin && (
                <>
                  <button
                    onClick={handleChangeSetting}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    disabled
                    className="text-xs text-gray-400 cursor-default"
                  >
                    Edit Group
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">{group.description}</p>

          {/* AM panel */}
          <div className="mb-6 p-4 rounded-lg border border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto-membership</span>
              {isAdmin && (
                <button disabled className="text-xs text-gray-400 cursor-default">
                  Edit Rules (V7)
                </button>
              )}
            </div>
            {rules ? <RuleSummary rules={rules} /> : <p className="text-sm text-gray-400">Not configured</p>}
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
              {members.map(({ person, role }) => {
                const isLastAdmin = role === 'ADMIN' && adminCount === 1
                const canRemoveThis = isAdmin || person.id === currentPersonId
                const canPromoteDemote = isAdmin && person.id !== currentPersonId
                return (
                  <li
                    key={person.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-sm gap-3"
                  >
                    <button
                      onClick={() => navigate(`/profile/${person.id}`)}
                      className="text-gray-700 font-medium hover:text-blue-600 transition-colors text-left flex-1"
                    >
                      {person.name}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <RoleBadge role={role} />
                      {canPromoteDemote && (
                        <button
                          onClick={() => handleRoleChange(person.id, role)}
                          disabled={isLastAdmin && role === 'ADMIN'}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-default transition-colors"
                        >
                          {role === 'ADMIN' ? 'Demote' : 'Promote'}
                        </button>
                      )}
                      {canRemoveThis && (
                        <button
                          onClick={() => handleRemove(person.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
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
  const opLabel: Record<string, string> = {
    is: 'is', is_not: 'is not', is_one_of: 'is one of',
    is_not_one_of: 'is not one of', contains: 'contains', does_not_contain: 'does not contain',
  }
  const conditionText = rules.conditions.map(c => {
    const val = Array.isArray(c.value) ? c.value.join(', ') : c.value
    return `${c.field} ${opLabel[c.operator] ?? c.operator} "${val}"`
  })
  return (
    <div className="text-sm text-gray-700 space-y-1">
      {conditionText.map((text, i) => (
        <div key={i}>
          {i > 0 && <span className="text-xs font-medium text-gray-400 uppercase mr-1">{rules.combinator}</span>}
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
