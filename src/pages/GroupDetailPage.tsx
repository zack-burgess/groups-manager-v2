import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getGroups, getSession } from '../services/storage'
import type { Group } from '../types'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<Group | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    if (!groupId) {
      navigate('/', { replace: true })
      return
    }
    const found = getGroups().find(g => g.id === groupId) ?? null
    if (!found) {
      navigate('/', { replace: true })
      return
    }
    setGroup(found)
  }, [groupId, navigate])

  if (!group) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h2>
          <p className="text-sm text-gray-500 mb-6">{group.description}</p>
          <p className="text-sm text-gray-400 italic">Group detail coming in V3.</p>
        </div>
      </main>
    </div>
  )
}
