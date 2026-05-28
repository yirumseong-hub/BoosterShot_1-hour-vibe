import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';
import PasswordGate from './components/PasswordGate';

export default function App() {
  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem('auth') === '1'
  );

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/problem/:id" element={<ProblemPage />} />
      </Routes>
    </BrowserRouter>
  );
}
