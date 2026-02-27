import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { performSearch, type SearchResult } from '../services/search'
import { getSession } from '../services/storage'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') ?? ''
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    setResults(performSearch(initialQuery))
  }, [initialQuery, navigate])

  const people = results.filter(r => r.type === 'person')
  const groups = results.filter(r => r.type === 'group')

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {initialQuery && (
            <p className="text-sm text-gray-500 mb-6">
              Results for <span className="font-medium text-gray-800">"{initialQuery}"</span>
            </p>
          )}

          {!initialQuery && (
            <p className="text-sm text-gray-400">Enter a search query above.</p>
          )}

          {initialQuery && (
            <div className="space-y-8">
              {/* People section */}
              <section>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  People
                </h3>
                {people.length === 0 ? (
                  <p className="text-sm text-gray-400 pl-4">No people found.</p>
                ) : (
                  <ul className="space-y-2">
                    {people.map(r => (
                      <li key={r.person.id}>
                        <button
                          onClick={() => navigate(`/profile/${r.person.id}`)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span>
                            <span className="text-sm font-medium text-gray-900">{r.person.name}</span>
                            <span className="text-sm text-gray-500 ml-2">· {r.person.title} · {r.person.organization}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Groups section */}
              <section>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Groups
                </h3>
                {groups.length === 0 ? (
                  <p className="text-sm text-gray-400 pl-4">No groups found.</p>
                ) : (
                  <ul className="space-y-2">
                    {groups.map(r => (
                      <li key={r.group.id}>
                        <button
                          onClick={() => navigate(`/group/${r.group.id}`)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          <span>
                            <span className="text-sm font-medium text-gray-900">{r.group.name}</span>
                            <span className="text-sm text-gray-500 ml-2">· {r.group.description}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
