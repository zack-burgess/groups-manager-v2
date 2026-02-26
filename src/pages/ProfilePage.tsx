import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { loadPerson } from '../services/people'
import { loadPersonMemberships } from '../services/memberships'
import { getSession } from '../services/storage'
import type { Person, Group, MemberRole } from '../types'

interface GroupMembership {
  group: Group
  role: MemberRole
}

export default function ProfilePage() {
  const { personId } = useParams<{ personId: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null>(null)
  const [memberships, setMemberships] = useState<GroupMembership[]>([])

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/', { replace: true })
      return
    }
    if (!personId) {
      navigate('/', { replace: true })
      return
    }
    const found = loadPerson(personId)
    if (!found) {
      navigate('/', { replace: true })
      return
    }
    setPerson(found)
    setMemberships(loadPersonMemberships(personId))
  }, [personId, navigate])

  if (!person) return null

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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{person.name}</h2>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</dt>
              <dd className="text-gray-900">{person.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Title</dt>
              <dd className="text-gray-900">{person.title}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Organization</dt>
              <dd className="text-gray-900">{person.organization}</dd>
            </div>
          </dl>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Groups</h3>
            {memberships.length === 0 ? (
              <p className="text-sm text-gray-400">No group memberships.</p>
            ) : (
              <ul className="space-y-2">
                {memberships.map(({ group, role }) => (
                  <li key={group.id}>
                    <button
                      onClick={() => navigate(`/group/${group.id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-sm"
                    >
                      <span className="text-gray-700 font-medium">{group.name}</span>
                      <RoleBadge role={role} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => navigate('/group/new')}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              + Create a group
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Member
    </span>
  )
}
