import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PREDEFINED_TITLES, PREDEFINED_ORGS } from '../data/lookups'
import { createEmployee } from '../services/people'

interface SetupLocationState {
  name: string
  email: string
}

export default function SetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as SetupLocationState | null

  const [title, setTitle] = useState('')
  const [org, setOrg] = useState('')

  useEffect(() => {
    if (!state?.name) {
      navigate('/', { replace: true })
    }
  }, [state, navigate])

  if (!state?.name) return null

  const isValid = title !== '' && org !== ''

  function handleComplete() {
    if (!isValid || !state) return
    const person = createEmployee(state.name, state.email, title, org)
    navigate(`/profile/${person.id}`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Complete your profile</h1>
        <p className="text-sm text-gray-500 mb-8">Tell us a bit more to get you set up.</p>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Name</p>
            <p className="text-gray-900 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">{state.name}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
            <p className="text-gray-500 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">{state.email}</p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <select
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select a title…</option>
              {PREDEFINED_TITLES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="org" className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              id="org"
              value={org}
              onChange={e => setOrg(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select an organization…</option>
              {PREDEFINED_ORGS.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              disabled={!isValid}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
