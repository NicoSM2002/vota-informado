import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Home from './pages/Home'
import Chat from './pages/Chat'

function App() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/chat/:candidateId" element={<Chat />} />
        </Routes>
      </AnimatePresence>
      <Analytics />
      <SpeedInsights />
    </div>
  )
}

export default App
