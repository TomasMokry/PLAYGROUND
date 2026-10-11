import { Fragment, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import OperationHome from './games/arithmetic/OperationHome'
import { OPERATION_LIST } from './games/arithmetic/operations'
import PracticeMode from './games/arithmetic/PracticeMode'
import SequenceMode from './games/arithmetic/SequenceMode'
import TimeAttackMode from './games/arithmetic/TimeAttackMode'
import EnglishMode from './games/english/EnglishMode'
import TopicHome from './games/english/TopicHome'
import { MODES, TOPIC_LIST } from './games/english/topics'
import { SUBJECT_LIST } from './games/registry'
import TetrisMode from './games/tetris/TetrisGame'
import Home from './pages/Home'
import SubjectHome from './pages/SubjectHome'
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
          {SUBJECT_LIST.map((subject) => (
            <Route key={subject.id} path={subject.path} element={<RequireProfile><SubjectHome key={subject.id} subject={subject} /></RequireProfile>} />
          ))}
          {/* Keyed by operation so state resets when switching between e.g. /scitani and /odcitani. */}
          {OPERATION_LIST.map((op) => (
            <Fragment key={op.id}>
              <Route path={op.path} element={<RequireProfile><OperationHome key={op.id} op={op} /></RequireProfile>} />
              <Route path={`${op.path}/rada/:group`} element={<RequireProfile><SequenceMode key={op.id} op={op} /></RequireProfile>} />
              <Route path={`${op.path}/trenink`} element={<RequireProfile><PracticeMode key={op.id} op={op} /></RequireProfile>} />
              <Route path={`${op.path}/zavod`} element={<RequireProfile><TimeAttackMode key={op.id} op={op} /></RequireProfile>} />
            </Fragment>
          ))}
          {TOPIC_LIST.map((topic) => (
            <Fragment key={topic.id}>
              <Route path={topic.path} element={<RequireProfile><TopicHome key={topic.id} topic={topic} /></RequireProfile>} />
              <Route path={`${topic.path}/vyber`} element={<RequireProfile><EnglishMode key={`${topic.id}-choose`} topic={topic} mode={MODES.choose} /></RequireProfile>} />
              <Route path={`${topic.path}/najdi`} element={<RequireProfile><EnglishMode key={`${topic.id}-find`} topic={topic} mode={MODES.find} /></RequireProfile>} />
              <Route path={`${topic.path}/napis`} element={<RequireProfile><EnglishMode key={`${topic.id}-write`} topic={topic} mode={MODES.write} /></RequireProfile>} />
            </Fragment>
          ))}
          <Route path="/tetris" element={<RequireProfile><TetrisMode /></RequireProfile>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ProfileProvider>
  )
}
