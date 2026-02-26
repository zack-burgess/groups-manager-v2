import { useEffect, useState } from 'react'
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
  const [conditions, setConditions] = useState<ConditionDraft[]>([])
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
  useEffect(() => {
    if (!groupId) return
    const valid = conditions.map(toCondition).filter((c): c is Condition => c !== null)
    setEvalResult(evaluateRules(valid, combinator, groupId, stagedPersonIds))
  }, [conditions, combinator, stagedPersonIds, groupId])

  function handleAddCondition() {
    setConditions(prev => [...prev, { id: `c${Date.now()}`, field: 'title', operator: 'is', value: '' }])
  }

  function handleRemoveCondition(id: string) {
    setConditions(prev => prev.filter(c => c.id !== id))
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
    saveRules(groupId, valid, combinator, triggerOnUpdate, [...stagedPersonIds])
    navigate(`/group/${groupId}`, { replace: true })
  }

  // N31: Cancel — discard all draft state (S11 is just React state, no cleanup needed)
  function handleCancel() {
    navigate(`/group/${groupId}`)
  }

  if (!group) return null

  const hasStagedAdds = evalResult.staged.length > 0
  const missingAndStaged = [...evalResult.missing, ...evalResult.staged]
  const conditionFields = [...new Set(
    conditions.map(toCondition).filter((c): c is Condition => c !== null).map(c => c.field)
  )]
  const showPreview = conditions.length > 0

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
          <p className="text-sm text-gray-500 mb-8">{group.name}</p>

          {/* Filters section */}
          <section className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Filters</h3>
            <div className="space-y-2">
              {conditions.map((cond, idx) => (
                <div key={cond.id}>
                  {/* U49: Combinator between condition rows (2+ conditions only) */}
                  {idx > 0 && (
                    <div className="flex items-center my-2">
                      <button
                        onClick={() => setCombinator(c => c === 'AND' ? 'OR' : 'AND')}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {combinator}
                      </button>
                    </div>
                  )}
                  <ConditionRow
                    condition={cond}
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
          {showPreview && (
            <section className="mb-8">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Preview</h3>
              <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">

                {/* Missing / Adding header (U52) */}
                <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">
                    {hasStagedAdds
                      ? `Adding (${evalResult.staged.length})`
                      : `Missing Members (${evalResult.missing.length})`}
                  </span>
                  {hasStagedAdds ? (
                    /* U80: ✕ button */
                    <button
                      onClick={handleClearStaged}
                      className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      ✕
                    </button>
                  ) : evalResult.missing.length > 0 ? (
                    /* U54: Add Now button */
                    <button
                      onClick={handleAddNow}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Add Now
                    </button>
                  ) : null}
                </div>

                {/* Missing / staged rows (U53) */}
                {missingAndStaged.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">No missing members.</div>
                ) : (
                  missingAndStaged.map(person => (
                    <PreviewRow key={person.id} person={person} fields={conditionFields} />
                  ))
                )}

                {/* U81: Current Members header */}
                <div className="px-4 py-3 bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">
                    Current Members ({evalResult.current.length})
                  </span>
                </div>

                {/* Current member rows (U53) */}
                {evalResult.current.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">No current members match these rules.</div>
                ) : (
                  evalResult.current.map(person => (
                    <PreviewRow key={person.id} person={person} fields={conditionFields} />
                  ))
                )}
              </div>
            </section>
          )}

          {/* Triggers section */}
          <section className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Triggers</h3>
            <div className="space-y-2">
              {/* U50: On Create/Rehire — always on, disabled */}
              <label className="flex items-center gap-3">
                <input type="checkbox" checked disabled className="opacity-50" />
                <span className="text-sm text-gray-500">On Create / Rehire (always on)</span>
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
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save Rules
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// U53: Preview row — name + values of referenced condition fields
function PreviewRow({ person, fields }: { person: Person; fields: Field[] }) {
  return (
    <div className="px-4 py-2 text-sm text-gray-700 flex items-center gap-2 flex-wrap">
      <span className="font-medium">{person.name}</span>
      {fields.map(field => (
        <span key={field} className="text-gray-400">· {getPersonFieldValue(person, field)}</span>
      ))}
    </div>
  )
}

// U44-U47: A single condition row
interface ConditionRowProps {
  condition: ConditionDraft
  onChange: (updates: Partial<ConditionDraft>) => void
  onRemove: () => void
}

function ConditionRow({ condition, onChange, onRemove }: ConditionRowProps) {
  const operatorOptions = condition.field === 'email' ? OPERATORS_EMAIL : OPERATORS_ALL
  const showMultiSelect = isMultiValueOp(condition.operator) && condition.field !== 'email'
  const fieldOptions = getFieldOptions(condition.field)
  const selectedValues = Array.isArray(condition.value) ? condition.value : []

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
      {/* U44: Field selector */}
      <select
        value={condition.field}
        onChange={e => onChange({ field: e.target.value as Field })}
        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="title">Title</option>
        <option value="organization">Organization</option>
        <option value="email">Email</option>
      </select>

      {/* U45: Operator selector */}
      <select
        value={condition.operator}
        onChange={e => onChange({ operator: e.target.value as Operator })}
        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {operatorOptions.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* U46: Value input — checkboxes for is_one_of, text otherwise */}
      <div className="flex-1">
        {showMultiSelect ? (
          <div className="max-h-36 overflow-y-auto p-2 border border-gray-300 rounded-lg bg-white space-y-1">
            {fieldOptions.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt)}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...selectedValues, opt]
                      : selectedValues.filter(v => v !== opt)
                    onChange({ value: next })
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={typeof condition.value === 'string' ? condition.value : ''}
            onChange={e => onChange({ value: e.target.value })}
            placeholder={`Enter ${condition.field}…`}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* U47: Remove button */}
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none pt-1"
      >
        ×
      </button>
    </div>
  )
}
