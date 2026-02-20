import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { initializeStorage } from './services/storage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import ProfilePage from './pages/ProfilePage'

initializeStorage()

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/profile/:personId" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}
