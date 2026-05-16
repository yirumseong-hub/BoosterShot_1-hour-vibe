import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, BarChart2, Trophy, AlertCircle } from 'lucide-react';
import { subjects, chapters, problemTypes } from '../data/dummy';
import { useAppStore } from '../store/useAppStore';
import ProblemCard from '../components/ProblemCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { problems } = useAppStore();

  const subject = subjects[0];
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId);

  // Stats for summary bar
  const total = problems.length;
  const solved = problems.filter(p => p.status !== 'unsolved').length;
  const correct = problems.filter(p => p.status === 'correct' || p.status === 'corrected').length;

  const typesForChapter = selectedChapterId
    ? problemTypes.filter(t => t.chapterId === selectedChapterId)
    : [];

  const problemsForType = (typeId: string) =>
    problems.filter(p => p.typeId === typeId);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-semibold text-white tracking-tight">미적분 학습 부스터</span>
            </div>
            {/* Quick stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <BarChart2 size={14} />
                <span className="font-mono">{solved}/{total}</span>
                <span className="text-zinc-600">풀이</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Trophy size={14} />
                <span className="font-mono text-emerald-400">{correct}</span>
                <span className="text-zinc-600">정답</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <AlertCircle size={14} />
                <span className="font-mono text-red-400">{problems.filter(p => p.status === 'wrong').length}</span>
                <span className="text-zinc-600">오답</span>
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mt-3 text-sm">
            <button
              onClick={() => setSelectedChapterId(null)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              {subject.name}
            </button>
            <ChevronRight size={14} className="text-zinc-600" />
            <button
              onClick={() => setSelectedChapterId(null)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              {subject.book}
            </button>
            {selectedChapter && (
              <>
                <ChevronRight size={14} className="text-zinc-600" />
                <span className="text-zinc-300 font-medium">{selectedChapter.name}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        {!selectedChapterId ? (
          /* Chapter selection */
          <div>
            <h2 className="text-xl font-semibold text-zinc-200 mb-1">단원 선택</h2>
            <p className="text-sm text-zinc-500 mb-6">학습할 단원을 선택하세요</p>
            <div className="grid grid-cols-1 gap-3">
              {chapters.map(ch => {
                const chProblems = problems.filter(p => p.chapterId === ch.id);
                const chSolved = chProblems.filter(p => p.status !== 'unsolved').length;
                const chCorrect = chProblems.filter(p => p.status === 'correct' || p.status === 'corrected').length;
                const pct = chProblems.length > 0 ? Math.round((chCorrect / chProblems.length) * 100) : 0;

                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-indigo-500/50 hover:bg-zinc-800/60 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center font-mono text-sm font-semibold text-zinc-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                        {ch.order}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-zinc-200 group-hover:text-white transition-colors">{ch.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {chProblems.length > 0
                            ? `${chSolved}/${chProblems.length} 풀이 완료`
                            : 'PDF 미업로드'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Progress bar */}
                      <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className="text-xs font-mono text-zinc-500">{pct}%</span>
                        <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Problem grid by type */
          <div className="space-y-10">
            {typesForChapter.map(type => {
              const typeProblems = problemsForType(type.id);
              if (typeProblems.length === 0) return null;

              return (
                <section key={type.id}>
                  {/* Section header */}
                  <div className={`flex items-center gap-3 mb-4 ${type.isChallenge ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {type.isChallenge && (
                      <Trophy size={16} className="text-amber-400" />
                    )}
                    <h3 className={`font-semibold ${type.isChallenge ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {type.name}
                    </h3>
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span className="text-xs font-mono text-zinc-600">
                      {typeProblems.filter(p => p.status !== 'unsolved').length}/{typeProblems.length}
                    </span>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />미풀이</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />오답</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />정답</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />재도전 정답</span>
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                    {typeProblems.map(problem => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        onClick={() => navigate(`/problem/${problem.id}`)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Status color legend bar at bottom */}
      <div className="sticky bottom-0 bg-zinc-950/90 backdrop-blur border-t border-zinc-800/60 py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-500">
          <span>localStorage에 자동 저장됩니다</span>
          <span className="font-mono">미적분 · 일등급 수학</span>
        </div>
      </div>
    </div>
  );
}
