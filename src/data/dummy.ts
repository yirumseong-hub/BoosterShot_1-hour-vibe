import type { Subject, Chapter, ProblemType, Problem } from '../types';

export const subjects: Subject[] = [
  { id: 'sub1', name: '미적분', book: '일등급 수학' },
];

export const chapters: Chapter[] = [
  { id: 'ch1', subjectId: 'sub1', name: '함수의 극한과 연속', order: 1 },
  { id: 'ch2', subjectId: 'sub1', name: '미분', order: 2 },
  { id: 'ch3', subjectId: 'sub1', name: '도함수의 활용 (1)', order: 3 },
  { id: 'ch4', subjectId: 'sub1', name: '도함수의 활용 (2)', order: 4 },
  { id: 'ch5', subjectId: 'sub1', name: '적분', order: 5 },
];

export const problemTypes: ProblemType[] = [
  // 도함수의 활용 (2)
  { id: 'type1', chapterId: 'ch4', name: '핵심유형1. 함수의 증가·감소와 극값' },
  { id: 'type2', chapterId: 'ch4', name: '핵심유형2. 다항함수의 그래프의 개형' },
  { id: 'type3', chapterId: 'ch4', name: '핵심유형3. 최댓값과 최솟값' },
  { id: 'type4', chapterId: 'ch4', name: '고난도 도전', isChallenge: true },
];

export const problems: Problem[] = [
  // 핵심유형2 문제들 (스케치 기준: 46~52)
  {
    id: 'p46', number: 46, chapterId: 'ch4', typeId: 'type2',
    correctAnswer: 3,
    status: 'wrong',
    attempts: [
      { id: 'a1', answer: 2, isCorrect: false, timeSeconds: 0, attemptedAt: '2024-05-10T10:00:00Z' },
      { id: 'a2', answer: 4, isCorrect: false, timeSeconds: 0, attemptedAt: '2024-05-11T10:00:00Z' },
    ],
  },
  {
    id: 'p47', number: 47, chapterId: 'ch4', typeId: 'type2',
    correctAnswer: 1,
    status: 'correct',
    bestTimeSeconds: 375,
    attempts: [
      { id: 'a3', answer: 1, isCorrect: true, timeSeconds: 375, attemptedAt: '2024-05-10T10:05:00Z' },
    ],
  },
  {
    id: 'p48', number: 48, chapterId: 'ch4', typeId: 'type2',
    correctAnswer: 5,
    status: 'corrected',
    bestTimeSeconds: 291,
    attempts: [
      { id: 'a4', answer: 2, isCorrect: false, timeSeconds: 320, attemptedAt: '2024-05-10T10:10:00Z' },
      { id: 'a5', answer: 5, isCorrect: true, timeSeconds: 291, attemptedAt: '2024-05-11T10:00:00Z' },
    ],
  },
  {
    id: 'p49', number: 49, chapterId: 'ch4', typeId: 'type2',
    correctAnswer: 2,
    status: 'correct',
    bestTimeSeconds: 191,
    attempts: [
      { id: 'a6', answer: 2, isCorrect: true, timeSeconds: 191, attemptedAt: '2024-05-10T10:15:00Z' },
    ],
  },
  {
    id: 'p50', number: 50, chapterId: 'ch4', typeId: 'type2',
    correctAnswer: 4,
    status: 'unsolved',
    attempts: [],
  },
  {
    id: 'p51', number: 51, chapterId: 'ch4', typeId: 'type2',
    correctAnswer: 3,
    status: 'unsolved',
    attempts: [],
  },
  {
    id: 'p52', number: 52, chapterId: 'ch4', typeId: 'type2',
    correctAnswer: 1,
    status: 'unsolved',
    attempts: [],
  },

  // 고난도 도전 문제들 (53~56)
  {
    id: 'p53', number: 53, chapterId: 'ch4', typeId: 'type4',
    correctAnswer: 2,
    status: 'unsolved',
    attempts: [],
  },
  {
    id: 'p54', number: 54, chapterId: 'ch4', typeId: 'type4',
    correctAnswer: 5,
    status: 'unsolved',
    attempts: [],
  },
  {
    id: 'p55', number: 55, chapterId: 'ch4', typeId: 'type4',
    correctAnswer: 3,
    status: 'wrong',
    attempts: [
      { id: 'a7', answer: 1, isCorrect: false, timeSeconds: 480, attemptedAt: '2024-05-10T10:20:00Z' },
    ],
  },
  {
    id: 'p56', number: 56, chapterId: 'ch4', typeId: 'type4',
    correctAnswer: 4,
    status: 'unsolved',
    attempts: [],
  },

  // 핵심유형1 문제들
  {
    id: 'p40', number: 40, chapterId: 'ch4', typeId: 'type1',
    correctAnswer: 3,
    status: 'correct',
    bestTimeSeconds: 150,
    attempts: [
      { id: 'a8', answer: 3, isCorrect: true, timeSeconds: 150, attemptedAt: '2024-05-09T09:00:00Z' },
    ],
  },
  {
    id: 'p41', number: 41, chapterId: 'ch4', typeId: 'type1',
    correctAnswer: 2,
    status: 'corrected',
    bestTimeSeconds: 210,
    attempts: [
      { id: 'a9', answer: 5, isCorrect: false, timeSeconds: 300, attemptedAt: '2024-05-09T09:05:00Z' },
      { id: 'a10', answer: 2, isCorrect: true, timeSeconds: 210, attemptedAt: '2024-05-10T09:00:00Z' },
    ],
  },
  {
    id: 'p42', number: 42, chapterId: 'ch4', typeId: 'type1',
    correctAnswer: 1,
    status: 'wrong',
    attempts: [
      { id: 'a11', answer: 4, isCorrect: false, timeSeconds: 250, attemptedAt: '2024-05-09T09:10:00Z' },
    ],
  },
];
