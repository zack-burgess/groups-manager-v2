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
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  People
                </h3>
                {people.length === 0 ? (
                  <p className="text-sm text-gray-400">No people found.</p>
                ) : (
                  <ul className="space-y-2">
                    {people.map(r => (
                      <li key={r.person.id}>
                        <button
                          onClick={() => navigate(`/profile/${r.person.id}`)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900">{r.person.name}</span>
                          <span className="text-sm text-gray-500 ml-2">· {r.person.title} · {r.person.organization}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Groups section */}
              <section>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Groups
                </h3>
                {groups.length === 0 ? (
                  <p className="text-sm text-gray-400">No groups found.</p>
                ) : (
                  <ul className="space-y-2">
                    {groups.map(r => (
                      <li key={r.group.id}>
                        <button
                          onClick={() => navigate(`/group/${r.group.id}`)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900">{r.group.name}</span>
                          <span className="text-sm text-gray-500 ml-2">· {r.group.description}</span>
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
