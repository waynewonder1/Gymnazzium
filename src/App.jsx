import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Plan from './pages/Plan';

// Home and My plan load straight away (and work offline from the first visit). Other pages are
// downloaded only when opened, which keeps the first visit light on data.
const Shop = lazy(() => import('./pages/Shop'));
const Topic = lazy(() => import('./pages/Topic'));
const Exercises = lazy(() => import('./pages/Exercises'));
const Login = lazy(() => import('./pages/Login'));
const Account = lazy(() => import('./pages/Account'));
const RoutineEditor = lazy(() => import('./pages/RoutineEditor'));
const Progress = lazy(() => import('./pages/Progress'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Feed = lazy(() => import('./pages/Feed'));
const Coach = lazy(() => import('./pages/Coach'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="plan" element={<Plan />} />
        <Route path="plan/routine" element={<RoutineEditor />} />
        <Route path="progress" element={<Progress />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="feed" element={<Feed />} />
        <Route path="coach" element={<Coach />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="shop" element={<Shop />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="paths/:slug" element={<Topic kind="paths" />} />
        <Route path="body-types/:slug" element={<Topic kind="body-types" />} />
        <Route path="learn/:slug" element={<Topic kind="learn" />} />
        <Route path="login" element={<Login />} />
        <Route path="account" element={<Account />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;
