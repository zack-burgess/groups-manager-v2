import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { getSession } from '../services/storage'
import { loadGroupForEdit, saveGroup } from '../services/groups'
import type { MembershipSetting } from '../types'

export default function CreateEditGroupPage() {
  const { groupId } = useParams<{ groupId?: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(groupId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [setting, setSetting] = useState<MembershipSetting>('ADMIN_ONLY')
  const [currentPersonId, setCurrentPersonId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) { navigate('/', { replace: true }); return }
    setCurrentPersonId(session.personId)

    if (groupId) {
      // N45: Load existing group for editing
      const group = loadGroupForEdit(groupId)
      if (!group) { navigate('/', { replace: true }); return }
      setName(group.name)
      setDescription(group.description)
      setSetting(group.membershipSetting)
    }
  }, [groupId, navigate])

  // N46: Save button enabled only when name is non-empty
  const isValid = name.trim() !== ''

  function handleSave() {
    if (!isValid || !currentPersonId) return
    // N47: Create or update group
    const saved = saveGroup(name.trim(), description.trim(), setting, currentPersonId, groupId)
    navigate(`/group/${saved.id}`, { replace: true })
  }

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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEditMode ? 'Edit Group' : 'Create Group'}
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Group name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this group for?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Who can add members?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="setting"
                    value="ADMIN_ONLY"
                    checked={setting === 'ADMIN_ONLY'}
                    onChange={() => setSetting('ADMIN_ONLY')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Admins only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="setting"
                    value="OPEN"
                    checked={setting === 'OPEN'}
                    onChange={() => setSetting('OPEN')}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Anyone in the group</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEditMode ? 'Save Changes' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
