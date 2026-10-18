import { Route, Routes } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Plan from './pages/Plan';
import Shop from './pages/Shop';
import Topic from './pages/Topic';
import Exercises from './pages/Exercises';
import Login from './pages/Login';
import Account from './pages/Account';
import RoutineEditor from './pages/RoutineEditor';
import Progress from './pages/Progress';
import Challenges from './pages/Challenges';
import Feed from './pages/Feed';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';

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
