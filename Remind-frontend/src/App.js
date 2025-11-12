import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Journals from './pages/Journals';
import Support from './pages/Support';
import OAuthCallback from './pages/OAuthCallback';
import { OAUTH_CALLBACK_PATH } from './utils/oauth';

const normalizedCallbackPath = OAUTH_CALLBACK_PATH.startsWith('/')
  ? OAUTH_CALLBACK_PATH
  : `/${OAUTH_CALLBACK_PATH}`;

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/journals" element={<Journals />} />
      <Route path="/support" element={<Support />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      {normalizedCallbackPath !== '/oauth/callback' && (
        <Route path={normalizedCallbackPath} element={<OAuthCallback />} />
      )}
    </Routes>
  </Router>
);

export default App;
