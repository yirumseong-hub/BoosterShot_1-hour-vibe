import { useState } from 'react';
import { Lock } from 'lucide-react';

// ── 비밀번호를 .env 파일에서 읽어옵니다 ──────────────────────────────────────
const PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? '';
// ──────────────────────────────────────────────────────────────────────────────

interface Props {
  onUnlock: () => void;
}

export default function PasswordGate({ onUnlock }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit() {
    if (input === PASSWORD) {
      sessionStorage.setItem('auth', '1');
      onUnlock();
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 w-full max-w-xs px-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <Lock size={22} className="text-indigo-400" />
        </div>
        <div className="text-center">
          <h1 className="text-white font-semibold text-lg">미적분 학습 부스터</h1>
          <p className="text-zinc-500 text-sm mt-1">비밀번호를 입력하세요</p>
        </div>
        <div className="w-full space-y-3">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="비밀번호"
            autoFocus
            className={`w-full px-4 py-3 rounded-xl bg-zinc-800 border text-white placeholder-zinc-600 focus:outline-none transition-colors text-center tracking-widest
              ${error ? 'border-red-500 animate-pulse' : 'border-zinc-700 focus:border-indigo-500'}`}
          />
          {error && (
            <p className="text-red-400 text-xs text-center">비밀번호가 틀렸습니다</p>
          )}
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            입장
          </button>
        </div>
      </div>
    </div>
  );
}
