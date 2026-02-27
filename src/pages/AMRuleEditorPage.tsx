import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getSession } from '../services/storage'
import { loadGroup, loadGroupRules } from '../services/groups'
import { evaluateRules, saveRules, type EvalResult } from '../services/rules'
import { PREDEFINED_TITLES, PREDEFINED_ORGS } from '../data/lookups'
import type { Condition, Group, Person } from '../types'

type Field = 'title' | 'organization' | 'email'
type Operator = Condition['operator']

interface ConditionDraft {
  id: string
  field: Field
  operator: Operator
  value: string | string[]
}

const OPERATORS_ALL: { value: Operator; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'is_one_of', label: 'is one of' },
  { value: 'is_not_one_of', label: 'is not one of' },
  { value: 'contains', label: 'contains' },
  { value: 'does_not_contain', label: 'does not contain' },
]

const OPERATORS_EMAIL: { value: Operator; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'does_not_contain', label: 'does not contain' },
]

function isMultiValueOp(op: Operator): boolean {
  return op === 'is_one_of' || op === 'is_not_one_of'
}

function getFieldOptions(field: Field): string[] {
  if (field === 'title') return PREDEFINED_TITLES
  if (field === 'organization') return PREDEFINED_ORGS
  return []
}

// Convert a draft to a valid Condition, or null if incomplete
function toCondition(draft: ConditionDraft): Condition | null {
  if (isMultiValueOp(draft.operator)) {
    if (!Array.isArray(draft.value) || draft.value.length === 0) return null
    return { field: draft.field, operator: draft.operator, value: draft.value }
  }
  if (typeof draft.value !== 'string' || !draft.value.trim()) return null
  return { field: draft.field, operator: draft.operator, value: draft.value.trim() }
}

function getPersonFieldValue(person: Person, field: Field): string {
  return person[field]
}

export default function AMRuleEditorPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<Group | null>(null)
  const [conditions, setConditions] = useState<ConditionDraft[]>([
    { id: 'c0', field: 'title', operator: 'is', value: '' },
  ])
  const [combinator, setCombinator] = useState<'AND' | 'OR'>('AND')
  const [triggerOnUpdate, setTriggerOnUpdate] = useState(false)
  const [stagedPersonIds, setStagedPersonIds] = useState<Set<string>>(new Set())
  const [evalResult, setEvalResult] = useState<EvalResult>({ missing: [], staged: [], current: [] })

  // N25: Load existing rules on mount
  useEffect(() => {
    const session = getSession()
    if (!session) { navigate('/', { replace: true }); return }
    if (!groupId) { navigate('/', { replace: true }); return }
    const found = loadGroup(groupId)
    if (!found) { navigate('/', { replace: true }); return }
    setGroup(found)

    const existing = loadGroupRules(groupId)
    if (existing) {
      setConditions(existing.conditions.map((c, i) => ({
        id: `c${i}`,
        field: c.field,
        operator: c.operator,
        value: c.value,
      })))
      setCombinator(existing.combinator)
      setTriggerOnUpdate(existing.triggerOnUpdate)
    }
  }, [groupId, navigate])

  // N27: Re-evaluate whenever conditions, combinator, or staged set changes
  // Option B: if any people are already staged, auto-stage new matches too
  useEffect(() => {
    if (!groupId) return
    const valid = conditions.map(toCondition).filter((c): c is Condition => c !== null)
    const result = evaluateRules(valid, combinator, groupId, stagedPersonIds)
    if (stagedPersonIds.size > 0 && result.missing.length > 0) {
      const newStagedIds = new Set([...stagedPersonIds, ...result.missing.map(p => p.id)])
      setStagedPersonIds(newStagedIds)
      setEvalResult(evaluateRules(valid, combinator, groupId, newStagedIds))
    } else {
      setEvalResult(result)
    }
  }, [conditions, combinator, stagedPersonIds, groupId])

  function handleAddCondition() {
    setConditions(prev => [...prev, { id: `c${Date.now()}`, field: 'title', operator: 'is', value: '' }])
  }

  function handleRemoveCondition(id: string) {
    if (conditions.length === 1) {
      setConditions([{ id, field: 'title', operator: 'is', value: '' }])
    } else {
      setConditions(prev => prev.filter(c => c.id !== id))
    }
  }

  function handleConditionChange(id: string, updates: Partial<ConditionDraft>) {
    setConditions(prev => prev.map(c => {
      if (c.id !== id) return c
      const next = { ...c, ...updates }
      // Field change: reset operator and value
      if (updates.field && updates.field !== c.field) {
        const ops = updates.field === 'email' ? OPERATORS_EMAIL : OPERATORS_ALL
        next.operator = ops[0].value
        next.value = ''
      }
      // Operator change: reset value if multi vs single changes
      if (updates.operator && updates.operator !== c.operator) {
        const nowMulti = isMultiValueOp(updates.operator)
        const wasMulti = isMultiValueOp(c.operator)
        if (nowMulti !== wasMulti) next.value = nowMulti ? [] : ''
      }
      return next
    }))
  }

  // N28: Stage all currently missing people
  function handleAddNow() {
    setStagedPersonIds(prev => new Set([...prev, ...evalResult.missing.map(p => p.id)]))
  }

  // N48: Clear staged adds without closing
  function handleClearStaged() {
    setStagedPersonIds(new Set())
  }

  // N30: Save rules + promote staged adds
  function handleSave() {
    if (!groupId) return
    const valid = conditions.map(toCondition).filter((c): c is Condition => c !== null)
    const session = getSession()
    saveRules(groupId, valid, combinator, triggerOnUpdate, [...stagedPersonIds], session?.personId ?? null)
    navigate(`/group/${groupId}`, { replace: true })
  }

  // N31: Cancel — discard all draft state (S11 is just React state, no cleanup needed)
  function handleCancel() {
    navigate(`/group/${groupId}`, { replace: true })
  }

  if (!group) return null

  const hasStagedAdds = evalResult.staged.length > 0
  const conditionFields = [...new Set(conditions.map(c => c.field))]
  const validConditions = conditions.map(toCondition).filter((c): c is Condition => c !== null)
  const hasIncomplete = validConditions.length < conditions.length
  const totalMatches = evalResult.missing.length + evalResult.staged.length + evalResult.current.length
  const hasNoMatches = validConditions.length > 0 && totalMatches === 0
  const allMatches = [
    ...evalResult.missing.map(p => ({ person: p, status: 'not-member' as const })),
    ...evalResult.staged.map(p => ({ person: p, status: 'queued' as const })),
    ...evalResult.current.map(p => ({ person: p, status: 'member' as const })),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={handleCancel}
          className="mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Auto-membership Rules</h2>
          <p className="text-sm text-gray-500 mb-8 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {group.name}
          </p>

          {/* Filters section */}
          <section className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Filters</h3>
            <div className="space-y-2 pl-3">
              {conditions.map((cond, idx) => (
                <div key={cond.id}>
                  {/* U49: Combinator between condition rows (2+ conditions only) */}
                  {idx > 0 && (
                    <div className="flex items-center my-2 pl-4">
                      <button
                        onClick={() => setCombinator(c => c === 'AND' ? 'OR' : 'AND')}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <span className={combinator === 'AND' ? 'opacity-100' : 'opacity-40'}>AND</span>
                        <span className="opacity-30">|</span>
                        <span className={combinator === 'OR' ? 'opacity-100' : 'opacity-40'}>OR</span>
                      </button>
                    </div>
                  )}
                  <ConditionRow
                    condition={cond}
                    isOnly={conditions.length === 1}
                    onChange={updates => handleConditionChange(cond.id, updates)}
                    onRemove={() => handleRemoveCondition(cond.id)}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleAddCondition}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              + Add Condition
            </button>
          </section>

          {/* Preview section */}
          <section className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Preview</h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden h-[200px]">
              <div className="divide-y divide-gray-100 h-full overflow-y-auto">
              {validConditions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Set a filter to see matches
                </div>
              ) : hasNoMatches ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No people match these rules — try adjusting your filters
                </div>
              ) : (
                <>
                  {/* Matches header */}
                  <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Matches ({totalMatches})
                    </span>
                    {hasStagedAdds ? (
                      <span className="relative group inline-flex items-center">
                        <button
                          onClick={handleClearStaged}
                          className="text-gray-400 hover:text-red-500 transition-colors text-sm leading-none inline-flex items-center"
                        >
                          ✕
                        </button>
                        <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 text-xs text-white bg-gray-700 rounded whitespace-nowrap hidden group-hover:block pointer-events-none">
                          Clear queue
                        </span>
                      </span>
                    ) : evalResult.missing.length > 0 ? (
                      <button
                        onClick={handleAddNow}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        + Add Non-Members
                      </button>
                    ) : null}
                  </div>

                  {/* Unified matches list */}
                  {allMatches.map(({ person, status }) => (
                    <PreviewRow key={person.id} person={person} fields={conditionFields} status={status} />
                  ))}
                </>
              )}
              </div>
            </div>
          </section>

          {/* Triggers section */}
          <section className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Triggers</h3>
            <div className="space-y-2">
              {/* U50: On Create/Rehire — always on, disabled */}
              <label className="flex items-center gap-3">
                <input type="checkbox" checked disabled className="opacity-50" />
                <span className="text-sm text-gray-500">On Create/Rehire</span>
              </label>
              {/* U51: On Update — toggleable */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggerOnUpdate}
                  onChange={e => setTriggerOnUpdate(e.target.checked)}
                />
                <span className="text-sm text-gray-700">On Update</span>
              </label>
            </div>
          </section>

          {/* Save / Cancel */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <span className="flex-1 relative group">
              <button
                onClick={handleSave}
                disabled={hasIncomplete}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Rules
              </button>
              {hasIncomplete && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-700 rounded whitespace-nowrap hidden group-hover:block pointer-events-none">
                  Remove empty filters to save
                </span>
              )}
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

type MatchStatus = 'member' | 'queued' | 'not-member'

// U53: Preview row — name + field values + membership status badge
function PreviewRow({ person, fields, status }: { person: Person; fields: Field[]; status: MatchStatus }) {
  const badge = {
    'member':     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 shrink-0">Member</span>,
    'queued':     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 shrink-0">Queued Member</span>,
    'not-member': <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 shrink-0">Non-Member</span>,
  }[status]

  return (
    <div className="pl-6 pr-4 py-2 text-sm text-gray-700 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span className="font-medium">{person.name}</span>
        {fields.map(field => (
          <span key={field} className="text-gray-400">· {getPersonFieldValue(person, field)}</span>
        ))}
      </div>
      {badge}
    </div>
  )
}

function PillSelect({ selected, options, onChange }: {
  selected: string[]
  options: string[]
  onChange: (v: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const available = options.filter(o => !selected.includes(o) && o.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="min-h-[34px] px-2 py-1 border border-gray-300 rounded-lg bg-white flex flex-wrap gap-1 items-center focus-within:ring-2 focus-within:ring-blue-500">
        {selected.map(val => (
          <span key={val} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">
            {val}
            <button
              onMouseDown={e => { e.preventDefault(); onChange(selected.filter(v => v !== val)) }}
              className="text-blue-400 hover:text-blue-800 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? 'Select values…' : ''}
          className="flex-1 min-w-[80px] text-sm outline-none"
        />
      </div>
      {open && available.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {available.map(opt => (
            <li
              key={opt}
              onMouseDown={() => { onChange([...selected, opt]); setQuery('') }}
              className="px-3 py-1.5 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Combobox({ value, options, onChange, placeholder }: {
  value: string
  options: string[]
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const filtered = options.filter(o => o.toLowerCase().includes(value.toLowerCase()))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.map(opt => (
            <li
              key={opt}
              onMouseDown={() => { onChange(opt); setOpen(false) }}
              className="px-3 py-1.5 text-sm text-gray-700 cursor-pointer hover:bg-blue-50"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// U44-U47: A single condition row
interface ConditionRowProps {
  condition: ConditionDraft
  isOnly: boolean
  onChange: (updates: Partial<ConditionDraft>) => void
  onRemove: () => void
}

function ConditionRow({ condition, isOnly, onChange, onRemove }: ConditionRowProps) {
  const operatorOptions = condition.field === 'email' ? OPERATORS_EMAIL : OPERATORS_ALL
  const showMultiSelect = isMultiValueOp(condition.operator) && condition.field !== 'email'
  const fieldOptions = getFieldOptions(condition.field)
  const selectedValues = Array.isArray(condition.value) ? condition.value : []

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
      {/* U44: Field selector */}
      <div className="relative">
        <select
          value={condition.field}
          onChange={e => onChange({ field: e.target.value as Field })}
          className="appearance-none pl-2 pr-7 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="title">Title</option>
          <option value="organization">Organization</option>
          <option value="email">Email</option>
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* U45: Operator selector */}
      <div className="relative">
        <select
          value={condition.operator}
          onChange={e => onChange({ operator: e.target.value as Operator })}
          className="appearance-none pl-2 pr-7 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {operatorOptions.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* U46: Value input — checkboxes for is_one_of, combobox/text otherwise */}
      <div className="flex-1">
        {showMultiSelect ? (
          <PillSelect
            selected={selectedValues}
            options={fieldOptions}
            onChange={v => onChange({ value: v })}
          />
        ) : (
          <Combobox
            value={typeof condition.value === 'string' ? condition.value : ''}
            options={fieldOptions}
            onChange={v => onChange({ value: v })}
            placeholder={`Enter ${condition.field}…`}
          />
        )}
      </div>

      {/* U47: Remove / clear button */}
      <span className="relative group inline-flex items-center">
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors text-sm leading-none inline-flex items-center"
        >
          ✕
        </button>
        <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 text-xs text-white bg-gray-700 rounded whitespace-nowrap hidden group-hover:block pointer-events-none">
          {isOnly ? 'Clear filter' : 'Remove filter'}
        </span>
      </span>
    </div>
  )
}
