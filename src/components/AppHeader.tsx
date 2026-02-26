import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSession } from '../services/storage'

export default function AppHeader() {
  const session = getSession()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
        <Link
          to={session ? `/profile/${session.personId}` : '/'}
          className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors shrink-0"
        >
          Groups Manager
        </Link>

        {session && (
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people and groups…"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>
        )}
      </div>
    </header>
  )
}
