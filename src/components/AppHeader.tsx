import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getSession } from '../services/storage'
import { logout } from '../services/people'

export default function AppHeader() {
  const session = getSession()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  function handleLogout() {
    logout()
    navigate('/')
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
          <>
            <form onSubmit={handleSearch} className="flex-1 max-w-sm relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search people and groups…"
                className="w-full px-3 py-1.5 pr-7 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); navigate('/search') }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors text-sm leading-none"
                >
                  ✕
                </button>
              )}
            </form>

            {/* H3-H7: Settings dropdown */}
            <div className="ml-auto relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                Settings ▾
              </button>

              {settingsOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => { setSettingsOpen(false); navigate('/employees') }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Manage Employees
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-default"
                  >
                    Reset Demo
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-default"
                  >
                    About
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
