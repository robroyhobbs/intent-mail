import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Brands from './pages/Brands';
import Intents from './pages/Intents';
import Templates from './pages/Templates';
import TestEmail from './pages/TestEmail';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="brands" element={<Brands />} />
        <Route path="intents" element={<Intents />} />
        <Route path="templates" element={<Templates />} />
        <Route path="test" element={<TestEmail />} />
        <Route path="logs" element={<Logs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
