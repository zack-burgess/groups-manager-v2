import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initializeStorage } from './services/storage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import GroupDetailPage from './pages/GroupDetailPage'
import EmployeeManagementPage from './pages/EmployeeManagementPage'
import CreateEditGroupPage from './pages/CreateEditGroupPage'

initializeStorage()

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/profile/:personId" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/group/:groupId" element={<GroupDetailPage />} />
        <Route path="/employees" element={<EmployeeManagementPage />} />
        <Route path="/group/new" element={<CreateEditGroupPage />} />
        <Route path="/group/:groupId/edit" element={<CreateEditGroupPage />} />
      </Routes>
    </BrowserRouter>
  )
}
