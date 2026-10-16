import type { RoundScore } from './receipt';

export const progressKey = 'flip-my-ride-progress-v1';
export type Progress = { version: 1; levelIndex: number; receipt: boolean; rounds: RoundScore[]; best: (RoundScore | null)[] };

export function readProgress(storage: Pick<Storage, 'getItem'>, levelCount: number): Progress | null {
  try {
    const data = JSON.parse(storage.getItem(progressKey) ?? 'null');
    const validScore = (score: RoundScore) => score && ['flips', 'hits', 'cars', 'trolleys', 'cones'].every(key =>
      Number.isSafeInteger(score[key as keyof RoundScore]) && score[key as keyof RoundScore] >= 0);
    if (!data || data.version !== 1 || !Number.isInteger(data.levelIndex) || data.levelIndex < 0 || data.levelIndex >= levelCount ||
      typeof data.receipt !== 'boolean' || !Array.isArray(data.rounds) || data.rounds.length > levelCount || !data.rounds.every(validScore) ||
      !Array.isArray(data.best) || data.best.length !== levelCount || !data.best.every((score: RoundScore | null) => score === null || validScore(score)) ||
      data.levelIndex > data.rounds.length || (data.receipt && !data.rounds[data.levelIndex])) return null;
    return data;
  } catch { return null; }
}

export function writeProgress(storage: Pick<Storage, 'setItem'>, progress: Progress) {
  try { storage.setItem(progressKey, JSON.stringify(progress)); return true; }
  catch { return false; }
}
