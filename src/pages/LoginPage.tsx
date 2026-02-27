import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { lookupPerson, generateEmail } from '../services/people'
import { getSession, saveSession } from '../services/storage'

type LoginState = 'idle' | 'welcome' | 'suspended'

export default function LoginPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('me')
  const [loginState, setLoginState] = useState<LoginState>('idle')
  const [welcomeName, setWelcomeName] = useState('')

  useEffect(() => {
    const session = getSession()
    if (session) {
      navigate(`/profile/${session.personId}`, { replace: true })
    }
  }, [navigate])

  function handleSignIn() {
    const trimmed = name.trim()
    if (!trimmed) return

    const person = lookupPerson(trimmed)

    if (person && person.status === 'ACTIVE') {
      saveSession({ personId: person.id })
      setWelcomeName(person.name)
      setLoginState('welcome')
      setTimeout(() => {
        navigate(`/profile/${person.id}`)
      }, 1500)
    } else if (person && person.status === 'SUSPENDED') {
      setLoginState('suspended')
    } else {
      const email = generateEmail(trimmed)
      navigate('/setup', { state: { name: trimmed, email } })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSignIn()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Groups Manager
        </h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to continue</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => e.target.select()}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name"
              autoComplete="off"
              autoFocus
            />
          </div>

          <button
            onClick={handleSignIn}
            disabled={!name.trim() || loginState === 'welcome'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sign In
          </button>
        </div>

        {loginState === 'welcome' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            Welcome back, {welcomeName}!
          </div>
        )}

        {loginState === 'suspended' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            This account has been suspended.
          </div>
        )}
      </div>
    </div>
  )
}
