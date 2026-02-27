import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initializeStorage } from './services/storage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import GroupDetailPage from './pages/GroupDetailPage'
import EmployeeManagementPage from './pages/EmployeeManagementPage'
import CreateEditGroupPage from './pages/CreateEditGroupPage'
import AMRuleEditorPage from './pages/AMRuleEditorPage'
import AboutPage from './pages/AboutPage'

initializeStorage()

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/profile/:personId" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/group/:groupId" element={<GroupDetailPage />} />
        <Route path="/employees" element={<EmployeeManagementPage />} />
        <Route path="/group/new" element={<CreateEditGroupPage />} />
        <Route path="/group/:groupId/edit" element={<CreateEditGroupPage />} />
        <Route path="/group/:groupId/rules" element={<AMRuleEditorPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  )
}
