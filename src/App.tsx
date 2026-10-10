import { Fragment, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import OperationHome from './games/arithmetic/OperationHome'
import { OPERATION_LIST } from './games/arithmetic/operations'
import PracticeMode from './games/arithmetic/PracticeMode'
import SequenceMode from './games/arithmetic/SequenceMode'
import TimeAttackMode from './games/arithmetic/TimeAttackMode'
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
          {/* Keyed by operation so state resets when switching between e.g. /scitani and /odcitani. */}
          {OPERATION_LIST.map((op) => (
            <Fragment key={op.id}>
              <Route path={op.path} element={<RequireProfile><OperationHome key={op.id} op={op} /></RequireProfile>} />
              <Route path={`${op.path}/rada/:group`} element={<RequireProfile><SequenceMode key={op.id} op={op} /></RequireProfile>} />
              <Route path={`${op.path}/trenink`} element={<RequireProfile><PracticeMode key={op.id} op={op} /></RequireProfile>} />
              <Route path={`${op.path}/zavod`} element={<RequireProfile><TimeAttackMode key={op.id} op={op} /></RequireProfile>} />
            </Fragment>
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProfileProvider>
  )
}
