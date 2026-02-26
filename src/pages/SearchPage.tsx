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

          {results.length === 0 && initialQuery && (
            <p className="text-sm text-gray-400">No results found.</p>
          )}

          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map(result =>
                result.type === 'person' ? (
                  <li key={result.person.id}>
                    <button
                      onClick={() => navigate(`/profile/${result.person.id}`)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{result.person.name}</span>
                      <span className="text-sm text-gray-500 ml-2">· {result.person.title} · {result.person.organization}</span>
                    </button>
                  </li>
                ) : (
                  <li key={result.group.id}>
                    <button
                      onClick={() => navigate(`/group/${result.group.id}`)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{result.group.name}</span>
                      <span className="text-sm text-gray-500 ml-2">· {result.group.description}</span>
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
