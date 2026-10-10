import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import MultiplicationHome from './games/multiplication/MultiplicationHome'
import PracticeMode from './games/multiplication/PracticeMode'
import SequenceMode from './games/multiplication/SequenceMode'
import TimeAttackMode from './games/multiplication/TimeAttackMode'
import Home from './pages/Home'
import { useProfiles } from './profiles/ProfileContext'
import ProfilePicker from './profiles/ProfilePicker'
import { ProfileProvider } from './profiles/ProfileProvider'

/** Screens below need a player; send them to the profile picker otherwise. */
function RequireProfile({ children }: { children: ReactNode }) {
  const { activeProfile } = useProfiles()
  return activeProfile ? children : <Navigate to="/profily" replace />
}

export default function App() {
  return (
    <ProfileProvider>
      <HashRouter>
        <Routes>
          <Route path="/profily" element={<ProfilePicker />} />
          <Route path="/" element={<RequireProfile><Home /></RequireProfile>} />
          <Route path="/nasobilka" element={<RequireProfile><MultiplicationHome /></RequireProfile>} />
          <Route path="/nasobilka/rada/:table" element={<RequireProfile><SequenceMode /></RequireProfile>} />
          <Route path="/nasobilka/trenink" element={<RequireProfile><PracticeMode /></RequireProfile>} />
          <Route path="/nasobilka/zavod" element={<RequireProfile><TimeAttackMode /></RequireProfile>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProfileProvider>
  )
}
