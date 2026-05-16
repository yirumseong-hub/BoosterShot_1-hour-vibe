import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import DrawingCanvas from '../components/DrawingCanvas';

type Phase = 'solving' | 'result';

export default function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProblem, addAttempt } = useAppStore();

  const problem = getProblem(id ?? '');

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Answer selection popup
  const [showAnswerPopup, setShowAnswerPopup] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Phase
  const [phase, setPhase] = useState<Phase>('solving');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Post-result
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!problem) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        문제를 찾을 수 없습니다.
      </div>
    );
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function handleSubmit() {
    if (selectedAnswer === null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = selectedAnswer === problem.correctAnswer;
    setIsCorrect(correct);

    addAttempt(problem.id, {
      answer: selectedAnswer,
      isCorrect: correct,
      timeSeconds: elapsed,
      attemptedAt: new Date().toISOString(),
    });

    setShowAnswerPopup(false);
    setPhase('result');
  }

  function handleSaveAndExit() {
    navigate(-1);
  }

  const ANSWER_LABELS = ['①', '②', '③', '④', '⑤'];

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-xs text-zinc-500">미적분 · 일등급수학</span>
            <div className="font-semibold text-sm">문제 {problem.number}</div>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-medium
          ${phase === 'result' ? 'bg-zinc-800 text-zinc-400' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'}`}>
          <Clock size={14} />
          {formatTime(elapsed)}
        </div>

        {/* Attempt history badge */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>
            {problem.attempts.filter(a => a.isCorrect).length}회 정답 ·{' '}
            {problem.attempts.filter(a => !a.isCorrect).length}회 오답
          </span>
          {problem.bestTimeSeconds && (
            <span className="px-2 py-0.5 bg-zinc-800 rounded font-mono">
              최고 {formatTime(problem.bestTimeSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Main content: left problem / right canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Problem image + answer button */}
        <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900/30">
          {/* Problem image area */}
          <div className="flex-1 overflow-auto p-4">
            {problem.imageUrl ? (
              <img
                src={problem.imageUrl}
                alt={`문제 ${problem.number}`}
                className="w-full rounded-lg"
              />
            ) : (
              /* Placeholder when no PDF extracted yet */
              <div className="w-full h-full min-h-[300px] rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-600 gap-3">
                <div className="text-4xl font-mono font-bold text-zinc-700">{problem.number}</div>
                <p className="text-sm text-center">PDF에서 문제 이미지를<br />불러오면 여기에 표시됩니다</p>
              </div>
            )}
          </div>

          {/* Bottom: Answer input */}
          <div className="p-4 border-t border-zinc-800 flex-shrink-0">
            {phase === 'solving' ? (
              <button
                onClick={() => setShowAnswerPopup(true)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors text-sm"
              >
                답안 선택
              </button>
            ) : (
              <div className="space-y-3">
                {/* Result banner */}
                <div className={`flex items-center gap-2 p-3 rounded-xl ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  {isCorrect ? (
                    <CheckCircle size={18} className="text-emerald-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                  <div>
                    <div className={`font-semibold text-sm ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {isCorrect ? '정답!' : '오답'}
                    </div>
                    <div className="text-xs text-zinc-500">
                      내 답: {ANSWER_LABELS[selectedAnswer! - 1]}
                      {!isCorrect && ` · 정답: ${ANSWER_LABELS[problem.correctAnswer - 1]}`}
                    </div>
                  </div>
                  <div className="ml-auto font-mono text-sm text-zinc-400">{formatTime(elapsed)}</div>
                </div>

                {/* Difficulty */}
                <div>
                  <div className="text-xs text-zinc-500 mb-1.5">난이도</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-colors
                          ${difficulty === d ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        {'★'.repeat(d)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="코멘트를 남겨보세요..."
                  className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                  rows={3}
                />

                <button
                  onClick={handleSaveAndExit}
                  className="w-full py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-semibold transition-colors text-sm"
                >
                  저장하고 돌아가기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Drawing canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DrawingCanvas />
        </div>
      </div>

      {/* Answer selection popup */}
      {showAnswerPopup && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setShowAnswerPopup(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAnswerPopup(false)} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-2xl">
            <h3 className="font-semibold text-center mb-5 text-lg">답안 선택</h3>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {ANSWER_LABELS.map((label, i) => (
                <button
                  key={i + 1}
                  onClick={() => setSelectedAnswer(i + 1)}
                  className={`py-4 rounded-xl text-xl font-bold transition-all
                    ${selectedAnswer === i + 1
                      ? 'bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/30'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAnswerPopup(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="flex-2 flex-grow py-3 rounded-xl bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
