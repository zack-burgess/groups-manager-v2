import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getSession } from '../services/storage'
import { PREDEFINED_TITLES, PREDEFINED_ORGS } from '../data/lookups'
import {
  loadAllEmployees, checkSystemAdminGuard,
  suspendEmployee, rehireEmployee,
  loadEmployeeForUpdate, updateEmployee,
  generateEmail, lookupPerson,
} from '../services/people'
import type { Person } from '../types'

export default function EmployeeManagementPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState<Person[]>([])
  const [suspended, setSuspended] = useState<Person[]>([])
  const [currentPersonId, setCurrentPersonId] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)

  function refresh() {
    const { active, suspended } = loadAllEmployees()
    setActive(active)
    setSuspended(suspended)
  }

  useEffect(() => {
    const session = getSession()
    if (!session) { navigate('/', { replace: true }); return }
    setCurrentPersonId(session.personId)
    refresh()
  }, [navigate])

  function handleSuspend(id: string) {
    suspendEmployee(id)
    refresh()
  }

  function handleRehire(id: string) {
    rehireEmployee(id)
    refresh()
  }

  function handleOpenUpdate(id: string) {
    const person = loadEmployeeForUpdate(id)
    if (person) setEditingPerson(person)
  }

  function handleUpdateSave(id: string, name: string, title: string, org: string) {
    updateEmployee(id, name, title, org)
    setEditingPerson(null)
    refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => currentPersonId && navigate(`/profile/${currentPersonId}`)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Employee Management</h2>
            <button
              onClick={() => navigate('/setup', { state: { name: '', email: '', fromAdmin: true } })}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Employee
            </button>
          </div>

          {/* Active employees */}
          <section className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Active ({active.length})
            </h3>
            <ul className="space-y-2">
              {active.map(person => {
                const isGuarded = checkSystemAdminGuard(person.id)
                return (
                  <li
                    key={person.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-sm gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900">{person.name}</span>
                      <span className="text-gray-400 ml-2">· {person.title} · {person.organization}</span>
                    </div>
                    {!isGuarded && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenUpdate(person.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleSuspend(person.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Suspend
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Suspended employees */}
          {suspended.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Suspended ({suspended.length})
              </h3>
              <ul className="space-y-2">
                {suspended.map(person => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 text-sm gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-400">{person.name}</span>
                      <span className="text-gray-300 ml-2">· {person.title} · {person.organization}</span>
                    </div>
                    <button
                      onClick={() => handleRehire(person.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors shrink-0"
                    >
                      Rehire
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      {/* Update Employee modal (P7.1) */}
      {editingPerson && (
        <UpdateEmployeeModal
          person={editingPerson}
          onSave={handleUpdateSave}
          onCancel={() => setEditingPerson(null)}
        />
      )}
    </div>
  )
}

interface UpdateEmployeeModalProps {
  person: Person
  onSave: (id: string, name: string, title: string, org: string) => void
  onCancel: () => void
}

function UpdateEmployeeModal({ person, onSave, onCancel }: UpdateEmployeeModalProps) {
  const [name, setName] = useState(person.name)
  const [title, setTitle] = useState(person.title)
  const [org, setOrg] = useState(person.organization)
  const derivedEmail = generateEmail(name)
  const existing = name.trim() ? lookupPerson(name.trim()) : null
  const nameTaken = existing !== null && existing.id !== person.id

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Update Employee</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${nameTaken ? 'border-red-400' : 'border-gray-300'}`}
              autoFocus
            />
            {nameTaken && (
              <p className="mt-1 text-xs text-red-500">This name is already taken.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
              {derivedEmail}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <select
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {PREDEFINED_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <select
              value={org}
              onChange={e => setOrg(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {PREDEFINED_ORGS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(person.id, name, title, org)}
              disabled={!name.trim() || nameTaken}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
