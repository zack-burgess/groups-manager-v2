import { Link } from 'react-router-dom'
import { getSession } from '../services/storage'

export default function AppHeader() {
  const session = getSession()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center">
        <Link
          to={session ? `/profile/${session.personId}` : '/'}
          className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          Groups Manager
        </Link>
      </div>
    </header>
  )
}
