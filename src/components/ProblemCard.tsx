import type { Problem } from '../types';

interface ProblemCardProps {
  problem: Problem;
  onClick: () => void;
}

const STATUS_STYLES = {
  unsolved: {
    border: 'border-zinc-700',
    bg: 'bg-zinc-900',
    badge: 'bg-zinc-700 text-zinc-300',
    label: '미풀이',
    dot: 'bg-zinc-500',
  },
  wrong: {
    border: 'border-red-500/70',
    bg: 'bg-red-950/40',
    badge: 'bg-red-500/20 text-red-400',
    label: '오답',
    dot: 'bg-red-500',
  },
  correct: {
    border: 'border-emerald-500/70',
    bg: 'bg-emerald-950/30',
    badge: 'bg-emerald-500/20 text-emerald-400',
    label: '정답',
    dot: 'bg-emerald-500',
  },
  corrected: {
    border: 'border-blue-500/70',
    bg: 'bg-blue-950/30',
    badge: 'bg-blue-500/20 text-blue-400',
    label: '재도전 정답',
    dot: 'bg-blue-500',
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ProblemCard({ problem, onClick }: ProblemCardProps) {
  const style = STATUS_STYLES[problem.status];
  const wrongCount = problem.attempts.filter(a => !a.isCorrect).length;
  const correctCount = problem.attempts.filter(a => a.isCorrect).length;
  const totalAttempts = problem.attempts.length;

  const showTime = (problem.status === 'correct' || problem.status === 'corrected') && problem.bestTimeSeconds !== undefined;

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-[4/3] rounded-xl border-2 ${style.border} ${style.bg}
        flex flex-col justify-between p-3
        transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-black/40
        active:scale-[0.98] cursor-pointer group
      `}
    >
      {/* Status dot */}
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${style.dot}`} />

      {/* Problem number */}
      <div className="flex items-start justify-between">
        <span className="font-mono font-semibold text-lg text-white leading-none">
          {problem.number}
        </span>
      </div>

      {/* Center: attempt count badges */}
      <div className="flex-1 flex items-center justify-center gap-1.5">
        {totalAttempts > 0 && (
          <div className="flex gap-1.5 items-center">
            {correctCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                ○ {correctCount}
              </span>
            )}
            {wrongCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono">
                × {wrongCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom: best time */}
      <div className="flex items-end justify-between">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${style.badge}`}>
          {style.label}
        </span>
        {showTime && (
          <span className="text-xs font-mono text-zinc-400">
            {problem.status === 'corrected' && <span className="text-[9px] text-blue-400 mr-0.5">Best</span>}
            {formatTime(problem.bestTimeSeconds!)}
          </span>
        )}
      </div>
    </button>
  );
}
