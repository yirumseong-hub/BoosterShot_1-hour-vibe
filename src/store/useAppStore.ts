import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Problem, Attempt } from '../types';
import { problems as initialProblems } from '../data/dummy';

interface AppState {
  problems: Problem[];
  addAttempt: (problemId: string, attempt: Omit<Attempt, 'id'>) => void;
  getProblem: (id: string) => Problem | undefined;
}

function computeStatus(attempts: Attempt[]): Problem['status'] {
  if (attempts.length === 0) return 'unsolved';
  const lastCorrect = attempts.some(a => a.isCorrect);
  const hasWrong = attempts.some(a => !a.isCorrect);
  if (lastCorrect && hasWrong) return 'corrected';
  if (lastCorrect) return 'correct';
  return 'wrong';
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      problems: initialProblems,

      addAttempt: (problemId, attempt) => {
        const id = `a_${Date.now()}`;
        set(state => ({
          problems: state.problems.map(p => {
            if (p.id !== problemId) return p;
            const newAttempts = [...p.attempts, { ...attempt, id }];
            const status = computeStatus(newAttempts);
            const correctAttempts = newAttempts.filter(a => a.isCorrect);
            const bestTimeSeconds = correctAttempts.length > 0
              ? Math.min(...correctAttempts.map(a => a.timeSeconds))
              : undefined;
            return { ...p, attempts: newAttempts, status, bestTimeSeconds };
          }),
        }));
      },

      getProblem: (id) => get().problems.find(p => p.id === id),
    }),
    { name: 'calculus-booster-storage' }
  )
);
