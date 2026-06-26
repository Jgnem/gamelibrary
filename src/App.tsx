import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import PlayPage from './pages/PlayPage.tsx'
import AdminPage from './pages/AdminPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/play/:slug" element={<PlayPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
