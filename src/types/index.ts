export type ProblemStatus = 'unsolved' | 'wrong' | 'correct' | 'corrected'; 
// unsolved=미풀이, wrong=틀림, correct=맞음, corrected=틀렸다가맞음

export interface Attempt {
  id: string;
  answer: number; // 1~5
  isCorrect: boolean;
  timeSeconds: number;
  attemptedAt: string; // ISO date
  comment?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
}

export interface Problem {
  id: string;
  number: number;
  chapterId: string;
  typeId: string;
  imageUrl?: string; // extracted from PDF
  correctAnswer: number; // 1~5, from answer PDF
  attempts: Attempt[];
  status: ProblemStatus;
  bestTimeSeconds?: number;
}

export interface ProblemType {
  id: string;
  chapterId: string;
  name: string; // e.g. "핵심유형2. 다항함수의 그래프의 개형"
  isChallenge?: boolean; // 고난도 도전 섹션
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string; // e.g. "다항함수의 미분"
  order: number;
}

export interface Subject {
  id: string;
  name: string; // e.g. "미적분"
  book: string; // e.g. "일등급 수학"
}
