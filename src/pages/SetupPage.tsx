import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PREDEFINED_TITLES, PREDEFINED_ORGS } from '../data/lookups'
import { createEmployee, generateEmail } from '../services/people'
import { getPeople, getGroups, getMemberships } from '../services/storage'
import { addMember, changeMemberRole } from '../services/groups'

interface SetupLocationState {
  name: string
  email: string
  fromAdmin?: boolean
}

export default function SetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as SetupLocationState | null
  const fromAdmin = state?.fromAdmin ?? false

  const [name, setName] = useState(state?.name ?? '')
  const [title, setTitle] = useState('Hiring Manager')
  const [org, setOrg] = useState('Human Resources')

  useEffect(() => {
    // In admin mode a blank name is fine — admin will fill it in.
    // In self-setup mode a missing name means we arrived here incorrectly.
    if (!fromAdmin && !state?.name) {
      navigate('/', { replace: true })
    }
  }, [state, fromAdmin, navigate])

  if (!fromAdmin && !state?.name) return null

  const derivedEmail = generateEmail(name)
  const isValid = name.trim() !== '' && title !== '' && org !== ''

  function handleComplete() {
    if (!isValid) return
    const email = fromAdmin ? derivedEmail : (state?.email ?? derivedEmail)
    // Detect first self-signup: no person with a timestamp-based ID exists yet
    const isFirstSignup = !fromAdmin && getPeople().every(p => Number(p.id.slice(1)) <= 100)
    // In admin mode: don't save session, navigate back to /employees
    const person = createEmployee(name, email, title, org, !fromAdmin)
    if (isFirstSignup) {
      const recruitingGroup = getGroups().find(g => g.name === 'Recruiting')
      if (recruitingGroup) {
        const recruitingAdmin = getMemberships().find(m => m.groupId === recruitingGroup.id && m.role === 'ADMIN')
        const actorId = recruitingAdmin?.personId ?? person.id
        addMember(recruitingGroup.id, person.id, actorId)
        changeMemberRole(recruitingGroup.id, person.id, 'ADMIN', actorId)
      }
    }
    if (fromAdmin) {
      navigate('/employees', { replace: true })
    } else {
      navigate(`/profile/${person.id}`, { replace: true })
    }
  }

  function handleBack() {
    if (fromAdmin) {
      navigate('/employees')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {fromAdmin ? 'Create Employee' : 'Complete your Employee Profile'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {fromAdmin ? "Fill in the new employee's details." : 'Fill in your details to get started.'}
        </p>

        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            {fromAdmin ? (
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            ) : (
              <p className="text-gray-900 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">{state?.name}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
            <p className="text-gray-500 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              {fromAdmin ? derivedEmail : state?.email}
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <div className="relative">
              <select
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select a title…</option>
                {PREDEFINED_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          <div>
            <label htmlFor="org" className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <div className="relative">
              <select
                id="org"
                value={org}
                onChange={e => setOrg(e.target.value)}
                className="w-full appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select an organization…</option>
                {PREDEFINED_ORGS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleBack}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              disabled={!isValid}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {fromAdmin ? 'Create Employee' : 'Complete Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
